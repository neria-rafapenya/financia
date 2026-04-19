interface SummaryCardProps {
  title: string;
  value: string;
  detail: string;
  accent: "teal" | "amber" | "coral" | "slate";
}

export function SummaryCard({
  title,
  value,
  detail,
  accent,
}: Readonly<SummaryCardProps>) {
  return (
    <article className={`summary-card summary-card--${accent}`}>
      <span className="summary-card__eyebrow">{title}</span>
      <strong className="summary-card__value">{value}</strong>
      <p className="summary-card__detail">{detail}</p>
    </article>
  );
}
