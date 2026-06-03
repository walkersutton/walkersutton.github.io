export default function SectionBar({
  title,
  count,
  href,
  linkLabel,
  spacing = "sm",
}: {
  title: string;
  count?: number;
  href?: string;
  linkLabel?: string;
  spacing?: "sm" | "lg";
}) {
  return (
    <div
      className={`flex items-baseline gap-3 ${spacing === "lg" ? "mt-16" : "mt-9"} mb-1 pb-3.5`}
      style={{ borderBottom: "1px solid var(--color-rule)" }}
    >
      <h2
        className="text-[17px] font-[680] tracking-[-0.01em] m-0"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>

      {count !== undefined && (
        <span className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
          {count}
        </span>
      )}

      {href && linkLabel && (
        <a
          href={href}
          className="ml-auto text-[14px] no-underline transition-colors duration-150 text-[var(--color-text-variant)] hover:text-[var(--accent)]"
        >
          {linkLabel}
        </a>
      )}
    </div>
  );
}
