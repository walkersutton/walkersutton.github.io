"use client";

import Link from "next/link";

export default function SectionBar({
  title,
  href,
  spacing = "sm",
}: {
  title: string;
  href?: string;
  spacing?: "sm" | "lg";
}) {
  const wrapper = `flex items-baseline ${spacing === "lg" ? "mt-[52px]" : "mt-9"} mb-[14px]`;

  if (!href) {
    return (
      <div className={wrapper}>
        <span
          className="text-[13px] font-semibold tracking-[0.01em] inline-block pb-px"
          style={{
            color: "var(--color-text)",
            borderBottom: "1.5px solid var(--color-text)",
          }}
        >
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <Link
        href={href}
        aria-label={`All ${title}`}
        className="section-link text-[13px] font-semibold tracking-[0.01em]"
        style={{ color: "var(--color-text)" }}
      >
        <span className="b b-bottom" />
        <span className="b b-right" />
        <span className="b b-top" />
        <span className="b b-left" />
        <span className="section-all" aria-hidden="true">
          all&nbsp;
        </span>
        <span>{title}</span>
      </Link>
    </div>
  );
}
