import Link from "next/link";

export interface PostItemProps {
  date?: string;
  title: string;
  href: string;
  excerpt?: string;
  isExternal?: boolean;
  tag?: string;
}

function fmtShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
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
      {/* Left: date + tag */}
      <span>
        {date && (
          <span
            className="block text-[13.5px]"
            style={{ color: "var(--color-text-faint)" }}
          >
            {fmtShort(date)}
          </span>
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

      {/* Middle: title + excerpt */}
      <span>
        <h3
          className="text-[23px] font-semibold tracking-[-0.02em] m-0"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h3>
        {excerpt && (
          <p
            className="mt-2 text-[15px] leading-[1.55] max-w-[60ch]"
            style={{ color: "var(--color-text-variant)" }}
          >
            {excerpt}
          </p>
        )}
      </span>

      {/* Right: arrow */}
      <span
        className="post-arrow text-[18px]"
        style={{ color: "var(--color-text-faint)" }}
      >
        {isExternal ? "↗" : "→"}
      </span>
    </Link>
  );
}
