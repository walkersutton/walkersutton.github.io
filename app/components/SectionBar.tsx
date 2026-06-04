"use client";

import Link from "next/link";
import { useState } from "react";

export default function SectionBar({
  title,
  href,
  linkLabel,
  spacing = "sm",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  spacing?: "sm" | "lg";
}) {
  const [arrowHov, setArrowHov] = useState(false);

  return (
    <div
      className={`flex items-baseline justify-between ${spacing === "lg" ? "mt-[52px]" : "mt-9"} mb-[14px]`}
    >
      <span
        className="text-[13px] font-semibold tracking-[0.01em] inline-block pb-px"
        style={{
          color: "var(--color-text)",
          borderBottom: "1.5px solid var(--color-text)",
        }}
      >
        {title}
      </span>

      {href && linkLabel && (
        <Link
          href={href}
          className="text-[12px] no-underline inline-flex items-center gap-[3px] transition-colors duration-150"
          style={{ color: arrowHov ? "var(--color-text)" : "var(--color-text-faint)" }}
          onMouseEnter={() => setArrowHov(true)}
          onMouseLeave={() => setArrowHov(false)}
        >
          {linkLabel.replace(" →", "")}{" "}
          <span
            style={{
              display: "inline-block",
              transition: "transform 0.18s cubic-bezier(0.23,1,0.32,1)",
              transform: arrowHov ? "translateX(3px)" : "none",
            }}
          >
            →
          </span>
        </Link>
      )}
    </div>
  );
}
