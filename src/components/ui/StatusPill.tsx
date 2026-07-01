export function labelize(value: string): string {
  return value.replace(/_/g, " ");
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes("fail") || normalized.includes("rejected") || normalized.includes("bad") || normalized.includes("error")
    ? "bad"
    : normalized.includes("success") || normalized.includes("approved") || normalized.includes("strong") || normalized.includes("good")
      ? "good"
      : normalized.includes("low") || normalized.includes("draft") || normalized.includes("info")
        ? "info"
        : "neutral";

  return <span className={`status-pill status-${tone}`}>{labelize(value)}</span>;
}
