import { F, type Meta, type Point } from '../types';
import { confidenceLabel, formatKoku, nrctSearchUrl, nrctUrl, transcriptionUrl } from '../lib/format';

interface Props {
  point: Point;
  meta: Meta;
  onClose: () => void;
}

export default function VillageDetail({ point, meta, onClose }: Props) {
  const source = meta.sources[point[F.Src]];
  const honkoku = transcriptionUrl(source?.entryId ?? '', point[F.Page]);
  const nrct = nrctUrl(point[F.NrctId]);

  return (
    <section className="panel detail">
      <button type="button" className="close" onClick={onClose} aria-label="閉じる">×</button>
      <h2>
        {point[F.Name]}
        <span className={point[F.Review] ? 'badge badge-review' : 'badge badge-ok'}>
          {point[F.Review] ? '要確認' : '確定'}
        </span>
      </h2>
      <dl>
        <dt>所属</dt>
        <dd>{source?.label ?? '—'}　{meta.guns[point[F.Gun]] || '—'}</dd>
        <dt>石高</dt>
        <dd>{formatKoku(point[F.Koku])}</dd>
        <dt>現在地名</dt>
        <dd>{point[F.ModernPlace] || '—'}</dd>
        <dt>GeoLOD_ID</dt>
        <dd><code>{point[F.GeolodId] || '—'}</code></dd>
        <dt>名寄せ</dt>
        <dd>
          {meta.methods[point[F.Method]] || '—'}
          {' / 信頼度 '}
          {point[F.Confidence].toFixed(2)}（{confidenceLabel(point[F.Confidence])}）
        </dd>
        <dt>次点差</dt>
        <dd>
          {point[F.Margin] === null ? '—（候補は1件だけ）' : point[F.Margin].toFixed(2)}
          {point[F.Margin] !== null && point[F.Margin] < 0 && (
            <span className="hint">記載順の制約から、最高得点でない候補を採っています</span>
          )}
        </dd>
      </dl>
      <ul className="links">
        {honkoku && <li><a href={honkoku} target="_blank" rel="noreferrer">みんなで翻刻でコマ {point[F.Page]} を見る</a></li>}
        {nrct && <li><a href={nrct} target="_blank" rel="noreferrer">『日本歴史地名大系』の項目</a></li>}
        <li><a href={nrctSearchUrl(point[F.Name])} target="_blank" rel="noreferrer">地名を検索</a></li>
      </ul>
    </section>
  );
}
