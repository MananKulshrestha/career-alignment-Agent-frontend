export function MetricGrid({ metrics }: { metrics: Array<[string, string]> }) {
  return (
    <dl className="metric-grid">
      {metrics.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <div className="tag-list">
      {items.slice(0, 12).map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export function JsonDetails({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="json-details">
      <summary>{title}</summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
