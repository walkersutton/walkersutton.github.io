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
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="post-row"
    >
      <span>
        <h3 className="post-title">
          <span className="b b-bottom" />
          <span className="b b-right" />
          <span className="b b-top" />
          <span className="b b-left" />
          {title}
          <span className="">{isExternal ? " ↗" : ""}</span>
        </h3>
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
    </Link>
  );
}
