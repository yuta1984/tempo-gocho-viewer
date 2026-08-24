import { COLORS, classLabels } from '../lib/layers';
import { formatCount } from '../lib/format';

interface Props {
  breaks: number[];
  distribution: number[];
  total: number;
}

/** 色は切りのよい石高で6階級。円の面積も石高に比例する二重符号化 */
export default function Legend({ breaks, distribution, total }: Props) {
  const labels = classLabels(breaks);
  return (
    <section className="panel legend">
      <h2>石高</h2>
      <ul>
        {COLORS.map((c, i) => (
          <li key={c}>
            <span className="swatch" style={{ background: c }} />
            <span className="range">{labels[i]} 石</span>
            <span className="count">{formatCount(distribution[i] ?? 0)}</span>
          </li>
        ))}
      </ul>
      <p className="hint">
        円の面積が石高に比例します。広い範囲を見ているあいだは、石高で重み付けした濃淡になります
        （2,000石以上は同じ重み）。信頼度0.5未満の村は薄く表示します。
      </p>
      <p className="hint">全 {formatCount(total)} 村</p>
    </section>
  );
}
