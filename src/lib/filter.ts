import { F, type Filters, type Meta, type Point, type Stats } from '../types';

export function defaultFilters(meta: Meta): Filters {
  return { src: null, gun: null, kokuMin: 0, kokuMax: Math.ceil(meta.koku.max), confidenceMin: 0, status: 'all' };
}

export function matches(p: Point, f: Filters): boolean {
  if (f.src !== null && p[F.Src] !== f.src) return false;
  if (f.gun !== null && p[F.Gun] !== f.gun) return false;
  const koku = p[F.Koku];
  if (koku < f.kokuMin || koku > f.kokuMax) return false;
  if (p[F.Confidence] < f.confidenceMin) return false;
  if (f.status === 'confirmed' && p[F.Review]) return false;
  if (f.status === 'review' && !p[F.Review]) return false;
  return true;
}

/**
 * 絞り込みとGeoJSON化と集計を1パスで済ませる。
 * MapLibre の setFilter 式で絞る手もあるが、表示中の村数と石高合計を
 * どのみちJS側で数える必要があるので、同じ走査でまとめてしまう方が速い。
 * feature.id には points 配列の添字を入れ、クリック時に元データを引けるようにする。
 */
export function buildGeoJson(
  points: Point[],
  f: Filters,
): { data: GeoJSON.FeatureCollection<GeoJSON.Point>; stats: Stats } {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  let koku = 0;
  let review = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!matches(p, f)) continue;
    koku += p[F.Koku];
    if (p[F.Review]) review++;
    features.push({
      type: 'Feature',
      id: i,
      geometry: { type: 'Point', coordinates: [p[F.Lng], p[F.Lat]] },
      properties: { koku: p[F.Koku], name: p[F.Name], review: p[F.Review] },
    });
  }
  return {
    data: { type: 'FeatureCollection', features },
    stats: { count: features.length, koku, review },
  };
}

/** 選択中の国に実際に現れる郡だけを、記載順で返す */
export function gunsInSource(points: Point[], src: number | null): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const p of points) {
    if (src !== null && p[F.Src] !== src) continue;
    const g = p[F.Gun];
    if (seen.has(g)) continue;
    seen.add(g);
    out.push(g);
  }
  return out;
}

/** 絞り込んだ結果を囲む範囲。国を切り替えたときに地図を寄せるのに使う */
export function boundsOf(points: Point[], f: Filters): [number, number, number, number] | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let n = 0;
  for (const p of points) {
    if (!matches(p, f)) continue;
    n++;
    if (p[F.Lng] < minX) minX = p[F.Lng];
    if (p[F.Lng] > maxX) maxX = p[F.Lng];
    if (p[F.Lat] < minY) minY = p[F.Lat];
    if (p[F.Lat] > maxY) maxY = p[F.Lat];
  }
  return n ? [minX, minY, maxX, maxY] : null;
}
