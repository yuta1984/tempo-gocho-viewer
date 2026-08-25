import type { Filters, Meta } from '../types';
import { formatCount, formatKoku } from '../lib/format';

interface Props {
  meta: Meta;
  filters: Filters;
  gunOptions: number[];
  onChange: (next: Filters) => void;
  onReset: () => void;
}

export default function FilterPanel({ meta, filters, gunOptions, onChange, onReset }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <section className="panel">
      <h2>絞り込み</h2>

      <label>
        国
        <select
          value={filters.src ?? ''}
          onChange={(e) => set({ src: e.target.value === '' ? null : Number(e.target.value), gun: null })}
        >
          <option value="">全国（{formatCount(meta.counts.mapped)} 村）</option>
          {meta.sources.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}（{formatCount(s.mapped)}）
            </option>
          ))}
        </select>
      </label>

      <label>
        郡
        <select
          value={filters.gun ?? ''}
          onChange={(e) => set({ gun: e.target.value === '' ? null : Number(e.target.value) })}
          disabled={filters.src === null}
        >
          <option value="">{filters.src === null ? '国を選ぶと使えます' : 'すべての郡'}</option>
          {gunOptions.map((g) => (
            <option key={g} value={g}>{meta.guns[g] || '（郡なし）'}</option>
          ))}
        </select>
      </label>

      <label>
        確認状態
        <select
          value={filters.status}
          onChange={(e) => set({ status: e.target.value as Filters['status'] })}
        >
          <option value="all">すべて（{formatCount(meta.counts.mapped)}）</option>
          <option value="confirmed">確定のみ（{formatCount(meta.counts.confirmed)}）</option>
          <option value="review">要確認のみ（{formatCount(meta.counts.review)}）</option>
        </select>
        <span className="hint">
          候補が1件で信頼度が高い村、または次点候補を大きく引き離した村を「確定」としています
        </span>
      </label>

      <label>
        石高の下限　<strong>{formatKoku(filters.kokuMin)}</strong>
        <input
          type="range"
          min={0}
          max={2000}
          step={10}
          value={Math.min(filters.kokuMin, 2000)}
          onChange={(e) => set({ kokuMin: Number(e.target.value) })}
        />
      </label>

      <label>
        信頼度の下限　<strong>{filters.confidenceMin.toFixed(2)}</strong>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={filters.confidenceMin}
          onChange={(e) => set({ confidenceMin: Number(e.target.value) })}
        />
        <span className="hint">上げるほど名寄せに自信のある村だけが残ります</span>
      </label>

      <button type="button" onClick={onReset}>条件をリセット</button>
    </section>
  );
}
