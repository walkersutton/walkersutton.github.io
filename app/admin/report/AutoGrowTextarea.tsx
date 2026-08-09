"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const FONT_SIZE = 16;
const LINE_HEIGHT = 1.6;
const PADDING_Y = 10;

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  ariaLabel?: string;
};

/**
 * A textarea that grows with its content. Phones give you no resize handle, so a
 * fixed-height box silently hides everything past the last visible line — you end
 * up typing blind. Height tracks scrollHeight instead, and the 16px font is
 * deliberate: iOS Safari zooms the whole viewport in whenever you focus a field
 * smaller than that, which is what forces the pinch-and-resize dance afterwards.
 */
export default function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  minRows = 4,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    // scrollHeight covers content + padding but not borders, which border-box
    // sizing does count in the height we're about to set.
    const border = el.offsetHeight - el.clientHeight;
    const minHeight = minRows * FONT_SIZE * LINE_HEIGHT + PADDING_Y * 2 + border;
    el.style.height = `${Math.max(el.scrollHeight + border, minHeight)}px`;
  }, [minRows]);

  useLayoutEffect(resize, [resize, value]);

  // Rotating the phone changes how many lines the text wraps into.
  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={minRows}
      style={{
        display: "block",
        width: "100%",
        fontSize: FONT_SIZE,
        fontFamily: "inherit",
        lineHeight: LINE_HEIGHT,
        padding: `${PADDING_Y}px 12px`,
        border: "1.5px solid var(--color-text)",
        borderRadius: 0,
        background: "transparent",
        color: "var(--color-text)",
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
}
