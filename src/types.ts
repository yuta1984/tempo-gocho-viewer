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
  ModernPlace = 11,
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
  modernPlace: string,
];

export interface Source {
  label: string;
  entryId: string;
  villages: number;
  mapped: number;
  koku: number;
}

export interface Meta {
  generated: string;
  fields: string[];
  sources: Source[];
  guns: string[];
  methods: string[];
  koku: { breaks: number[]; distribution: number[]; max: number; total: number; totalAll: number };
  counts: { scanned: number; mapped: number; skippedNoCoord: number };
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
}

export interface Stats {
  count: number;
  koku: number;
}
