/** build-viewer-data.js の FIELDS と対応する。並び順を変えるときは両方を直すこと。 */
export const enum F {
  Lng = 0,
  Lat = 1,
  Koku = 2,
  Name = 3,
  Gun = 4,
  Src = 5,
  Page = 6,
  GeolodId = 7,
  NrctId = 8,
  Confidence = 9,
  Method = 10,
  Review = 11,
  Margin = 12,
  ModernPlace = 13,
}

export type Point = [
  lng: number,
  lat: number,
  koku: number,
  name: string,
  gun: number,
  src: number,
  page: number,
  geolodId: string,
  nrctId: string,
  confidence: number,
  method: number,
  /** 1 = 人手の確認が要る、0 = 確定 */
  review: 0 | 1,
  /** 次点候補とのスコア差。候補が1件なら null */
  margin: number | null,
  modernPlace: string,
];

export interface Source {
  label: string;
  entryId: string;
  villages: number;
  mapped: number;
  review: number;
  koku: number;
}

export interface Meta {
  generated: string;
  fields: string[];
  sources: Source[];
  guns: string[];
  methods: string[];
  koku: { breaks: number[]; distribution: number[]; max: number; total: number; totalAll: number };
  counts: { scanned: number; mapped: number; skippedNoCoord: number; review: number; confirmed: number };
  attribution: { data: string; basemap: string };
}

export interface Filters {
  /** 資料(国)の添字。null は全国 */
  src: number | null;
  /** 郡の添字。null はすべての郡 */
  gun: number | null;
  kokuMin: number;
  kokuMax: number;
  confidenceMin: number;
  /** 'all' すべて / 'confirmed' 確定のみ / 'review' 要確認のみ */
  status: 'all' | 'confirmed' | 'review';
}

export interface Stats {
  count: number;
  koku: number;
  review: number;
}
