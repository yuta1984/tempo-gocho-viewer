/** 石高は小数第3位まで意味があるが、一覧では読みやすさを優先して丸める */
export function formatKoku(koku: number): string {
  if (koku >= 100) return `${Math.round(koku).toLocaleString('ja-JP')} 石`;
  return `${koku.toFixed(3).replace(/\.?0+$/, '')} 石`;
}

export function formatCount(n: number): string {
  return n.toLocaleString('ja-JP');
}

/** みんなで翻刻の該当コマ */
export function transcriptionUrl(entryId: string, page: number): string | null {
  if (!entryId || !page) return null;
  return `https://honkoku.org/app/#/transcription/${entryId}/${page}`;
}

/**
 * 『日本歴史地名大系』の地名項目ページ。
 * 短い geolod_id ではなく entry_id で引く (先頭2桁が都道府県コード)。
 */
export function nrctUrl(nrctId: string): string | null {
  if (!nrctId || nrctId.length < 3) return null;
  return `https://geoshape.ex.nii.ac.jp/nrct/resource/${nrctId.slice(0, 2)}/${nrctId}.html`;
}

/** 地名の検索画面 (辞書に該当が無い村の手がかり) */
export function nrctSearchUrl(name: string): string {
  return `https://geoshape.ex.nii.ac.jp/app/search-nrct?key=${encodeURIComponent(name)}`;
}

export function confidenceLabel(v: number): string {
  if (v >= 0.8) return '高';
  if (v >= 0.5) return '中';
  if (v > 0) return '低';
  return '—';
}
