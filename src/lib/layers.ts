import type { ExpressionSpecification, LayerSpecification } from 'maplibre-gl';

export const SOURCE_ID = 'villages';
export const HEAT_LAYER = 'villages-heat';
export const CIRCLE_LAYER = 'villages-circle';
export const LABEL_LAYER = 'villages-label';

/**
 * れきちずで最初に現れる symbol レイヤ。ここより前に自前のレイヤを挿すと、
 * 円は道路や境界より上・地名ラベルより下に入り、ベースマップの文字が読める。
 */
export const INSERT_BEFORE = 'text-ferry';

/** 『日本歴史地名大系』の地名ラベル (れきちず側のレイヤ) */
export const NRCT_LAYER = 'nrct';

/**
 * ヒートマップから円へ切り替えるズーム。
 * 村は平均 2.4km 間隔で、緯度35度では z10 で約19px。
 * つまり z10 が「村が個体として分離して見え始める」境界なので、
 * その前後1ズームでクロスフェードする。
 */
export const FADE_FROM = 9.5;
export const FADE_TO = 10.5;
const CIRCLE_MINZOOM = 9;
const HEAT_MAXZOOM = 11;

/**
 * 石高の色。
 * れきちずの地色は淡い緑の陸 (#e5f1e5) と水色の海 (rgb(163,206,240)) なので、
 * 青系・緑系のランプは沈んで見えない。暖色の逐次スケールを使う。
 * 輝度が単調に変わるので、色覚特性に関わらず階級の順序が読める。
 */
export const COLORS = ['#ffe9a8', '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#a80f26'];

/** 凡例のラベル。breaks と対応させる */
export function classLabels(breaks: number[]): string[] {
  return [
    `〜${breaks[0]}`,
    ...breaks.slice(0, -1).map((b, i) => `${b}〜${breaks[i + 1]}`),
    `${breaks[breaks.length - 1]}〜`,
  ];
}

/** step 式にして、凡例の階級と地図の色が厳密に対応するようにする */
export function colorExpression(breaks: number[]): ExpressionSpecification {
  const stops: (number | string)[] = [];
  breaks.forEach((b, i) => stops.push(b, COLORS[i + 1]));
  return ['step', ['get', 'koku'], COLORS[0], ...stops] as ExpressionSpecification;
}

/**
 * 円の半径は石高の平方根に比例させる (面積が石高に比例する)。
 * ズームは paint プロパティ最上位の interpolate にしか書けないため、
 * 「外側がズーム補間 / 各出力が石高の式」という形が唯一の書き方。
 * 石高0の村が消えないよう下限を、巨大村が画面を占領しないよう上限を置く。
 */
function radiusExpression(): ExpressionSpecification {
  const scale = (k: number, minPx: number, maxPx: number): ExpressionSpecification =>
    ['max', minPx, ['min', maxPx, ['*', k, ['sqrt', ['get', 'koku']]]]] as ExpressionSpecification;
  return [
    'interpolate', ['linear'], ['zoom'],
    CIRCLE_MINZOOM, scale(0.11, 1.5, 12),
    11, scale(0.2, 2, 20),
    13, scale(0.34, 2.5, 30),
    15, scale(0.6, 3, 48),
  ] as ExpressionSpecification;
}

export function heatLayer(): LayerSpecification {
  return {
    id: HEAT_LAYER,
    type: 'heatmap',
    source: SOURCE_ID,
    maxzoom: HEAT_MAXZOOM,
    paint: {
      // 石高に比例させたまま2,000石で頭打ちにする。
      // 対数や平方根で圧縮すると「石高の密度」ではなく「村の数の密度」に近づき、
      // 見せたいものが変わってしまう。上限で頭打ちになるのは全体の1.8%だけ。
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'koku'], 0, 0.05, 2000, 1],
      // 低ズームでは1つのカーネルに多くの村が入るので抑え、寄るほど上げる
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 7, 1.6, 10, 3],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 9, 7, 15, 10, 24],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(255,255,255,0)',
        0.1, 'rgba(255,233,168,0.75)',
        0.3, 'rgba(254,178,76,0.85)',
        0.5, 'rgba(253,141,60,0.9)',
        0.7, 'rgba(240,59,32,0.92)',
        1, 'rgba(150,10,35,0.95)',
      ],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], FADE_FROM, 0.85, FADE_TO, 0],
    },
  } as LayerSpecification;
}

export function circleLayer(breaks: number[]): LayerSpecification {
  return {
    id: CIRCLE_LAYER,
    type: 'circle',
    source: SOURCE_ID,
    minzoom: CIRCLE_MINZOOM,
    paint: {
      'circle-radius': radiusExpression(),
      'circle-color': colorExpression(breaks),
      // 淡い地色から浮かせるための白い縁取り
      'circle-stroke-color': 'rgba(255,255,255,0.9)',
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 0.3, 12, 0.8],
      // 人手の確認が要る村は薄く出す。隠すより、確かでないことが見える方がよい。
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        FADE_FROM, 0,
        FADE_TO, ['case', ['==', ['get', 'review'], 1], 0.35, 0.8],
      ],
      'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], FADE_FROM, 0, FADE_TO, 0.85],
    },
  } as LayerSpecification;
}

export function labelLayer(): LayerSpecification {
  return {
    id: LABEL_LAYER,
    type: 'symbol',
    source: SOURCE_ID,
    minzoom: 12,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans CJK JP Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 15, 13],
      'text-offset': [0, 1.1],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': '#4a2f1a',
      'text-halo-color': 'rgba(255,255,255,0.95)',
      'text-halo-width': 1.5,
    },
  } as LayerSpecification;
}
