import CardImageBox from "./CardImageBox";

function fmtMonthDay(iso: string) {
  // Date-only strings parse as UTC midnight; pin them to midday so the day
  // doesn't slip backwards in US time zones.
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LatestCard({
  label,
  href,
  isExternal,
  title,
  description,
  thumbnail,
  publishedAt,
}: {
  label: string;
  href: string;
  isExternal: boolean;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
}) {
  const linkProps = {
    href,
    target: isExternal ? "_blank" : undefined,
    rel: isExternal ? "noopener noreferrer" : undefined,
    className: "latest-card-trigger",
    style: { color: "inherit", textDecoration: "none" },
  };

  // Only the image and the title are links; the label and description
  // around them aren't clickable. Hovering either link animates both.
  return (
    <div
      className="latest-card flex items-center gap-5 sm:gap-6"
      style={{ color: "var(--color-text)" }}
    >
      {/* Duplicate of the title link, so keep it out of tab order and the
          accessibility tree. */}
      <a {...linkProps} tabIndex={-1} aria-hidden className="latest-card-trigger shrink-0">
        <CardImageBox className="w-[132px] sm:w-[176px] aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </CardImageBox>
      </a>
      <div className="flex flex-col items-start gap-[3px] min-w-0">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--color-text-variant)" }}
        >
          the latest · {label}
          {publishedAt && <> · {fmtMonthDay(publishedAt)}</>}
        </span>
        <a {...linkProps}>
          <span
            className="latest-card-title"
            style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.015em", textUnderlineOffset: "2px" }}
          >
            {title}
            {isExternal && " ↗"}
          </span>
        </a>
        {description && (
          <span
            className="line-clamp-2"
            style={{ fontSize: 13, color: "var(--color-text-variant)", lineHeight: 1.4 }}
          >
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
