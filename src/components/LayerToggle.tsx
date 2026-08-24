interface Props {
  showNrct: boolean;
  showLabels: boolean;
  onNrct: (v: boolean) => void;
  onLabels: (v: boolean) => void;
}

export default function LayerToggle({ showNrct, showLabels, onNrct, onLabels }: Props) {
  return (
    <section className="panel">
      <h2>表示</h2>
      <label className="check">
        <input type="checkbox" checked={showLabels} onChange={(e) => onLabels(e.target.checked)} />
        郷帳の村名（拡大時）
      </label>
      <label className="check">
        <input type="checkbox" checked={showNrct} onChange={(e) => onNrct(e.target.checked)} />
        『日本歴史地名大系』の地名
      </label>
      <p className="hint">
        地名大系のラベルはれきちず側のレイヤです。名寄せが合っていれば、郷帳の村がこのラベルに重なります。
      </p>
    </section>
  );
}
