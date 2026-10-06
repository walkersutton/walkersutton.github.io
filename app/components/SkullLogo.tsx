"use client";

import Link from "next/link";
import { useRef, useState } from "react";

/**
 * The skull logo with its crossbones: they spring out on hover and spin on
 * click (styles under "Logo press / crossbones hover" in globals.css). Shared
 * by the site header and the admin sidebar so both behave identically.
 *
 * The eyes are painted, not cut out, so they take --skull-eye — set it to the
 * background the logo sits on when that isn't --color-bg.
 */
export default function SkullLogo({
  href,
  width = 19,
  className = "",
  style,
  label,
  children,
}: {
  href: string;
  /** Rendered width in px; height follows the 100×115 viewBox. */
  width?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible name, for when there's no visible text beside the skull. */
  label?: string;
  children?: React.ReactNode;
}) {
  const [bonesPhase, setBonesPhase] = useState<"spin-cw" | "spin-ccw" | "retract" | null>(null);
  const hoveringRef = useRef(false);

  return (
    <Link
      href={href}
      aria-label={label}
      className={`logo-link ${className}`}
      style={style}
      onClick={() => setBonesPhase(Math.random() < 0.5 ? "spin-cw" : "spin-ccw")}
      onMouseEnter={() => {
        hoveringRef.current = true;
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
      }}
    >
      <svg
        viewBox="0 0 100 115"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: "block",
          width,
          height: Math.round((width * 115) / 100),
          flexShrink: 0,
          overflow: "visible",
        }}
        aria-hidden="true"
      >
        <g
          className={`crossbones${bonesPhase === "spin-cw" ? " spin-cw" : bonesPhase === "spin-ccw" ? " spin-ccw" : ""}${bonesPhase === "retract" ? " retract" : ""}`}
          onAnimationEnd={() =>
            setBonesPhase((prev) =>
              // After the spin: if the cursor left, hand off to the retract
              // animation; otherwise the :hover rule holds the bones out.
              (prev === "spin-cw" || prev === "spin-ccw") && !hoveringRef.current
                ? "retract"
                : null,
            )
          }
        >
          <line
            x1="-15"
            y1="15"
            x2="115"
            y2="105"
            stroke="currentColor"
            strokeWidth="17"
            strokeLinecap="round"
          />
          <circle cx="-15" cy="15" r="13" fill="currentColor" />
          <circle cx="115" cy="105" r="13" fill="currentColor" />
          <line
            x1="115"
            y1="15"
            x2="-15"
            y2="105"
            stroke="currentColor"
            strokeWidth="17"
            strokeLinecap="round"
          />
          <circle cx="115" cy="15" r="13" fill="currentColor" />
          <circle cx="-15" cy="105" r="13" fill="currentColor" />
        </g>
        <path
          d="M50 6 C25 6 5 26 5 51 C5 68 14 82 27 89.5 L27 111 L35 111 L65 111 L73 111 L73 89.5 C86 82 95 68 95 51 C95 26 75 6 50 6Z"
          fill="currentColor"
        />
        <ellipse cx="33" cy="53" rx="10" ry="10" fill="var(--skull-eye, var(--color-bg))" />
        <ellipse cx="67" cy="53" rx="10" ry="10" fill="var(--skull-eye, var(--color-bg))" />
      </svg>
      {children}
    </Link>
  );
}
