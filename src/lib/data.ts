import type { Meta, Point } from '../types';

const BASE = `${import.meta.env.BASE_URL}data`;

export interface Dataset {
  meta: Meta;
  points: Point[];
}

export async function loadDataset(): Promise<Dataset> {
  const [metaRes, pointsRes] = await Promise.all([
    fetch(`${BASE}/meta.json`),
    fetch(`${BASE}/points.json`),
  ]);
  if (!metaRes.ok || !pointsRes.ok) {
    throw new Error(
      'データを読み込めませんでした。先に `npm run data` (= node ../build-viewer-data.js) を実行してください。',
    );
  }
  const [meta, points] = await Promise.all([
    metaRes.json() as Promise<Meta>,
    pointsRes.json() as Promise<Point[]>,
  ]);
  return { meta, points };
}
