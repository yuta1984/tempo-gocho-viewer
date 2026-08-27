import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AttributionControl, GeoJSONSource, MapLibreMap, NavigationControl, Popup, ScaleControl,
  setWorkerUrl,
  type MapLayerMouseEvent, type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {
  CIRCLE_LAYER, INSERT_BEFORE, LABEL_LAYER, NRCT_LAYER, SOURCE_ID,
  circleLayer, heatLayer, labelLayer,
} from '../lib/layers';

/**
 * れきちずのスタイル。CC BY-NC-ND なので、fork も改変もせず URL のまま読む。
 * 自前のレイヤは実行時に addLayer で重ねるだけに留める。
 */
const STYLE_URL = 'https://mierune.github.io/rekichizu-style/styles/street/style.json';

// ワーカーの実体を明示的に教える。これを省くと本番ビルドでワーカーが起動せず、
// 地図の背景色だけが出てベクトルタイルが1枚も読み込まれない。
setWorkerUrl(maplibreWorkerUrl);

const EMPTY: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: 'FeatureCollection', features: [] };

const DEFAULT_VIEW = { center: [137, 36.5] as [number, number], zoom: 4.5 };

/** URLの #ズーム/緯度/経度 で初期表示を指定できる。リンクの共有にも使える。 */
function viewFromHash(): { center: [number, number]; zoom: number } {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return DEFAULT_VIEW;
  const [zoom, lat, lng] = parts;
  return { center: [lng, lat], zoom };
}

interface Props {
  geojson: GeoJSON.FeatureCollection<GeoJSON.Point>;
  kokuBreaks: number[];
  showNrct: boolean;
  showLabels: boolean;
  fitBounds: [number, number, number, number] | null;
  onSelect: (index: number | null) => void;
  /** 吹き出しを出す位置。null なら閉じる */
  popupAt: [number, number] | null;
  /** 吹き出しの中身 */
  children?: ReactNode;
}

export default function MapView({
  geojson, kokuBreaks, showNrct, showLabels, fitBounds, onSelect, popupAt, children,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  // 吹き出しの中身は React が描く。MapLibre には器の DOM だけを渡す。
  const popup = useRef<Popup | null>(null);
  const popupNode = useRef<HTMLDivElement | null>(null);
  if (!popupNode.current && typeof document !== 'undefined') {
    popupNode.current = document.createElement('div');
  }
  const [ready, setReady] = useState(false);
  const [layersAdded, setLayersAdded] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  // MapLibre はスタイルやレイヤの不具合を例外ではなく error イベントで知らせる
  const [mapError, setMapError] = useState<string | null>(null);

  // 地図の生成は一度きり。StrictMode の二重実行に備えて cleanup で確実に捨てる。
  useEffect(() => {
    if (!container.current || map.current) return;
    // WebGL が使えない環境では MapLibre のコンストラクタが例外を投げる。
    // ここで捕まえないとツリーごと巻き添えになり真っ白な画面になる。
    let m: MapLibreMap;
    try {
      m = new MapLibreMap({
        container: container.current,
        style: STYLE_URL,
        ...viewFromHash(),
        maxZoom: 16,
        attributionControl: false,
      });
    } catch (e) {
      setFailed(e instanceof Error ? e.message : String(e));
      return;
    }
    map.current = m;
    // 開発時のみ、コンソールから地図をいじれるようにしておく
    if (import.meta.env.DEV) (window as unknown as { __map: MapLibreMap }).__map = m;
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    m.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
    m.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: '天保郷帳データセット (CC BY-SA 4.0)',
      }),
      'bottom-right',
    );
    m.on('error', (e) => {
      const msg = (e as unknown as { error?: Error }).error?.message ?? String(e);
      console.error('[maplibre]', msg);
      // ベースマップ側のタイル取得失敗は表示に影響しないので画面には出さない
      // (産総研の標高タイルは陸域の外で400を返す)
      if (/AJAXError|Failed to fetch/.test(msg)) return;
      setMapError(msg);
    });
    m.on('load', () => setReady(true));
    m.on('moveend', () => {
      const c = m.getCenter();
      const next = `#${m.getZoom().toFixed(2)}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`;
      window.history.replaceState(null, '', next);
    });
    return () => {
      m.remove();
      map.current = null;
      setReady(false);
      setLayersAdded(false);
    };
  }, []);

  // スタイルの読み込みが終わってから、自前のソースとレイヤを足す
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || m.getSource(SOURCE_ID)) return;
    // 基盤タイルが z14 までなので索引もそこで打ち止めにする。
    // buffer は既定128だと点数×タイル数が増えるので、最大半径を賄える64で足りる。
    m.addSource(SOURCE_ID, { type: 'geojson', data: EMPTY, maxzoom: 14, buffer: 64, tolerance: 0 });
    const before = m.getLayer(INSERT_BEFORE) ? INSERT_BEFORE : undefined;
    m.addLayer(heatLayer(), before);
    m.addLayer(circleLayer(kokuBreaks), before);
    m.addLayer(labelLayer(), before);
    setLayersAdded(true);

    const onClick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.id;
      onSelect(typeof id === 'number' ? id : null);
    };
    m.on('click', CIRCLE_LAYER, onClick);
    m.on('mouseenter', CIRCLE_LAYER, () => { m.getCanvas().style.cursor = 'pointer'; });
    m.on('mouseleave', CIRCLE_LAYER, () => { m.getCanvas().style.cursor = ''; });
    // 円以外をクリックしたら選択を外す
    m.on('click', (e: MapMouseEvent) => {
      const hits = m.queryRenderedFeatures(e.point, { layers: [CIRCLE_LAYER] });
      if (!hits.length) onSelect(null);
    });
  }, [ready, kokuBreaks, onSelect]);

  // 絞り込み結果の反映
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const src = m.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    src?.setData(geojson);
    setFeatureCount(geojson.features.length);
  }, [geojson, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getLayer(NRCT_LAYER)) return;
    m.setLayoutProperty(NRCT_LAYER, 'visibility', showNrct ? 'visible' : 'none');
  }, [showNrct, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !m.getLayer(LABEL_LAYER)) return;
    m.setLayoutProperty(LABEL_LAYER, 'visibility', showLabels ? 'visible' : 'none');
  }, [showLabels, ready]);

  // 選択した村の上に吹き出しを出す。位置が変わっても開いたまま動かす。
  useEffect(() => {
    const m = map.current;
    const node = popupNode.current;
    if (!m || !ready || !node) return;
    if (!popupAt) {
      popup.current?.remove();
      return;
    }
    if (!popup.current) {
      popup.current = new Popup({
        closeButton: false,      // 閉じるボタンは中身側で用意している
        closeOnClick: false,     // 地図のクリックは MapView 側で拾って選択を外す
        focusAfterOpen: false,
        maxWidth: '320px',
        offset: 12,
        className: 'village-popup',
      });
    }
    popup.current.setLngLat(popupAt).setDOMContent(node).addTo(m);
  }, [popupAt, ready]);

  useEffect(() => () => { popup.current?.remove(); popup.current = null; }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !fitBounds) return;
    m.fitBounds(fitBounds, { padding: 60, maxZoom: 11, duration: 800 });
  }, [fitBounds, ready]);

  if (failed) {
    return (
      <div className="map map-failed">
        <p>地図を初期化できませんでした。</p>
        <p className="hint">{failed}</p>
        <p className="hint">WebGL が使えるブラウザで開いてください。</p>
      </div>
    );
  }
  return (
    <>
      <div ref={container} className="map" />
      {import.meta.env.DEV && (
        <div className="mapstatus">
          style {ready ? '✓' : '…'} / layers {layersAdded ? '✓' : '…'} / 地物 {featureCount.toLocaleString('ja-JP')}
        </div>
      )}
      {mapError && <div className="maperror">地図の描画に問題があります: {mapError}</div>}
      {popupAt && popupNode.current && createPortal(children, popupNode.current)}
    </>
  );
}
