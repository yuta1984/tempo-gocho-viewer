import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import Legend from './components/Legend';
import LayerToggle from './components/LayerToggle';
import StatsBar from './components/StatsBar';
import VillageDetail from './components/VillageDetail';
import { loadDataset, type Dataset } from './lib/data';
import { boundsOf, buildGeoJson, defaultFilters, gunsInSource } from './lib/filter';
import type { Filters } from './types';

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showNrct, setShowNrct] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [fitBounds, setFitBounds] = useState<[number, number, number, number] | null>(null);

  useEffect(() => {
    let alive = true;
    loadDataset()
      .then((d) => {
        if (!alive) return;
        setDataset(d);
        setFilters(defaultFilters(d.meta));
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  // 絞り込み・GeoJSON化・集計は同じ1パスで済ませる
  const result = useMemo(() => {
    if (!dataset || !filters) return null;
    return buildGeoJson(dataset.points, filters);
  }, [dataset, filters]);

  const gunOptions = useMemo(
    () => (dataset && filters ? gunsInSource(dataset.points, filters.src) : []),
    [dataset, filters],
  );

  // 国を切り替えたときだけ地図を寄せる。石高や信頼度の調整では動かさない。
  const handleFilters = useCallback((next: Filters) => {
    setFilters((prev) => {
      if (dataset && prev && (prev.src !== next.src || prev.gun !== next.gun)) {
        setFitBounds(boundsOf(dataset.points, next));
        setSelected(null);
      }
      return next;
    });
  }, [dataset]);

  const handleReset = useCallback(() => {
    if (!dataset) return;
    setFilters(defaultFilters(dataset.meta));
    setFitBounds(null);
    setSelected(null);
  }, [dataset]);

  if (error) {
    return (
      <div className="boot boot-error">
        <h1>天保郷帳 石高マップ</h1>
        <p>{error}</p>
      </div>
    );
  }
  if (!dataset || !filters || !result) {
    return (
      <div className="boot">
        <h1>天保郷帳 石高マップ</h1>
        <p>データを読み込んでいます…</p>
      </div>
    );
  }

  const { meta, points } = dataset;
  // 選択中の国で座標が付かなかった村の数。統計から黙って落とさず明示する。
  const unmapped = filters.src === null
    ? meta.counts.skippedNoCoord
    : meta.sources[filters.src].villages - meta.sources[filters.src].mapped;
  const sourceLabel = filters.src === null
    ? '全国'
    : `${meta.sources[filters.src].label}${filters.gun !== null ? ` ${meta.guns[filters.gun]}` : ''}`;

  return (
    <div className="app">
      <header>
        <h1>天保郷帳 石高マップ</h1>
        <p className="sub">
          天保年間（1834–44）の郷帳に記された村の石高を、同時代の地図「れきちず」の上に重ねています。
        </p>
      </header>

      <aside>
        <FilterPanel
          meta={meta}
          filters={filters}
          gunOptions={gunOptions}
          onChange={handleFilters}
          onReset={handleReset}
        />
        <LayerToggle
          showNrct={showNrct}
          showLabels={showLabels}
          onNrct={setShowNrct}
          onLabels={setShowLabels}
        />
        <Legend
          breaks={meta.koku.breaks}
          distribution={meta.koku.distribution}
          total={meta.counts.mapped}
        />
        {selected !== null && points[selected] && (
          <VillageDetail point={points[selected]} meta={meta} onClose={() => setSelected(null)} />
        )}
        <footer>
          <p>
            地図: <a href="https://rekichizu.jp/" target="_blank" rel="noreferrer">れきちず</a>（CC BY-NC-ND 4.0・非商用）
          </p>
          <p>
            データ: <a href="https://github.com/yuta1984/tempo_gocho" target="_blank" rel="noreferrer">天保郷帳データセット</a>（CC BY-SA 4.0）
          </p>
          <p className="hint">
            座標が付いた {meta.counts.mapped.toLocaleString('ja-JP')} 村を表示しています
            （郷帳全体は {meta.counts.scanned.toLocaleString('ja-JP')} 村）。
          </p>
        </footer>
      </aside>

      <main>
        <MapView
          geojson={result.data}
          kokuBreaks={meta.koku.breaks}
          showNrct={showNrct}
          showLabels={showLabels}
          fitBounds={fitBounds}
          onSelect={setSelected}
        />
        <StatsBar stats={result.stats} meta={meta} sourceLabel={sourceLabel} unmapped={unmapped} />
      </main>
    </div>
  );
}
