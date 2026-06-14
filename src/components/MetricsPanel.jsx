export default function MetricsPanel({ metrics }) {
  return (
    <section className="metrics-grid" aria-label="Hasil perhitungan">
      {metrics.display.map((item) => (
        <article className="metric-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.unit ? <small>{item.unit}</small> : null}
        </article>
      ))}
    </section>
  );
}
