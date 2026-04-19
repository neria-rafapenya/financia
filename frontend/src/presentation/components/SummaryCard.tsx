import { Link } from "react-router-dom";

interface SummaryCardProps {
  title: string;
  value: string;
  detail: string;
  accent: "teal" | "amber" | "coral" | "slate";
  actionLabel?: string;
  actionTo?: string;
}

export function SummaryCard({
  title,
  value,
  detail,
  accent,
  actionLabel,
  actionTo,
}: Readonly<SummaryCardProps>) {
  return (
    <article className={`summary-card summary-card--${accent}`}>
      <span className="summary-card__eyebrow">{title}</span>
      <strong className="summary-card__value">{value}</strong>
      <p className="summary-card__detail">{detail}</p>
      {actionLabel && actionTo ? (
        <Link className="summary-card__link" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}
