import type { Meta, Stats } from '../types';
import { formatCount, formatKoku } from '../lib/format';

interface Props {
  stats: Stats;
  meta: Meta;
  sourceLabel: string;
  unmapped: number;
}

export default function StatsBar({ stats, meta, sourceLabel, unmapped }: Props) {
  const share = meta.koku.total ? (stats.koku * 100) / meta.koku.total : 0;
  return (
    <div className="stats">
      <span className="scope">{sourceLabel}</span>
      <span><strong>{formatCount(stats.count)}</strong> 村</span>
      <span>石高 <strong>{formatKoku(stats.koku)}</strong></span>
      <span className="hint">地図に出せる全石高の {share.toFixed(1)}%</span>
      {stats.review > 0 && <span className="review">要確認 {formatCount(stats.review)} 村</span>}
      {unmapped > 0 && (
        // 座標が付かなかった村を黙って落とすと、石高が実態より少ないことに気づけない
        <span className="warn">座標未同定 {formatCount(unmapped)} 村は地図に出ていません</span>
      )}
    </div>
  );
}
