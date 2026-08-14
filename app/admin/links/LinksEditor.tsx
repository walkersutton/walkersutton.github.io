"use client";

import { useActionState, useEffect, useState } from "react";
import type { SiteLink } from "@/lib/links";
import { BTN, INPUT } from "../styles";
import type { SaveResult } from "../types";

const SMALL_BTN: React.CSSProperties = {
  background: "transparent",
  color: "var(--color-text-faint)",
  border: "1.5px solid var(--color-border-faint)",
  // 40px square-ish: these sit next to each other on a phone.
  minHeight: 40,
  minWidth: 44,
  padding: "0 12px",
  fontSize: 11,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

/**
 * Edits the rows on /links: label, where it points, and what order they're in.
 *
 * The list is submitted whole rather than row by row, so reordering and
 * deleting are the same save as an edit, and what you see is what the page
 * gets. Rows are held in React state so a save can't repaint a field you were
 * still typing in.
 */
export default function LinksEditor({
  links,
  action,
}: {
  links: SiteLink[];
  action: (prev: SaveResult, formData: FormData) => Promise<SaveResult>;
}) {
  const [rows, setRows] = useState<SiteLink[]>(links);
  const [result, formAction, pending] = useActionState<SaveResult, FormData>(action, {});
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!result.saved) return;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 4000);
    return () => clearTimeout(timer);
  }, [result]);

  function updateRow(i: number, patch: Partial<SiteLink>) {
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Arrows rather than drag-and-drop: this gets used one-handed on a phone,
  // where dragging a row fights with scrolling the page.
  function move(i: number, delta: number) {
    setRows((prev) => {
      const next = [...prev];
      const target = i + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 12,
            border: "1px solid var(--color-border-faint)",
          }}
        >
          <input
            name="label"
            placeholder="Label, e.g. Strava"
            value={row.label}
            onChange={(e) => updateRow(i, { label: e.target.value })}
            style={INPUT}
          />
          <input
            name="href"
            placeholder="https://… or /trips"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            value={row.href}
            onChange={(e) => updateRow(i, { href: e.target.value })}
            style={INPUT}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Move ${row.label || "link"} up`}
              style={{ ...SMALL_BTN, opacity: i === 0 ? 0.35 : 1 }}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === rows.length - 1}
              aria-label={`Move ${row.label || "link"} down`}
              style={{ ...SMALL_BTN, opacity: i === rows.length - 1 ? 0.35 : 1 }}
            >
              ↓
            </button>
            <button type="button" onClick={() => removeRow(i)} style={SMALL_BTN}>
              Remove
            </button>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
          No links. The page will show only the trip links, when there&apos;s a trip.
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { label: "", href: "" }])}
          style={SMALL_BTN}
        >
          + Add link
        </button>
        <button
          type="submit"
          disabled={pending}
          style={{ ...BTN(true), opacity: pending ? 0.5 : 1 }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {result.error && (
        <div style={{ fontSize: 13, color: "var(--accent-red, #c0392b)" }}>{result.error}</div>
      )}
      {flash && result.saved && (
        <div style={{ fontSize: 13, color: "var(--color-text-faint)" }}>Saved {result.saved}.</div>
      )}
    </form>
  );
}
