import Link from "next/link";

export interface PostItemProps {
  date?: string;
  title: string;
  href: string;
  excerpt?: string;
  isExternal?: boolean;
  tag?: string;
}

function fmtMonthYear(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export default function PostItem({
  date,
  title,
  href,
  excerpt,
  isExternal,
  tag,
}: PostItemProps) {
  return (
    <div className="post-row">
      <span>
        <Link
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <h3 className="post-title">
            <span className="b b-bottom" />
            <span className="b b-right" />
            <span className="b b-top" />
            <span className="b b-left" />
            {title}
            <span>{isExternal ? " ↗" : ""}</span>
          </h3>
        </Link>
        {excerpt && (
          <p
            className="text-[13.5px] leading-[1.5] m-0 max-w-[60ch]"
            style={{ color: "var(--color-text-variant)" }}
          >
            {excerpt}
          </p>
        )}
        {tag && (
          <span
            className="block mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--accent)" }}
          >
            {tag}
          </span>
        )}
      </span>

      <span className="post-meta">
        {date && <span className="post-date">{fmtMonthYear(date)}</span>}
      </span>
    </div>
  );
}
