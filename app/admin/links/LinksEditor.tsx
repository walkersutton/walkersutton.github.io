"use client";

import { useActionState, useEffect, useState } from "react";
import { VISIBILITY_OPTIONS, type SiteLink } from "@/lib/links";
import { SMALL_BTN } from "../styles";
import type { SaveResult } from "../types";

/**
 * Edits every row on /links: label, where it points, when it shows, and what
 * order they're in. The trip rows are in here too — nothing on that page is
 * editable only by changing the code.
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
  const [result, formAction, pending] = useActionState<SaveResult, FormData>(
    action,
    {},
  );
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!result.saved) return;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 4000);
    return () => clearTimeout(timer);
  }, [result]);

  function updateRow(i: number, patch: Partial<SiteLink>) {
    setRows((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
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
    <form action={formAction}>
      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Link</th>
              <th>Shows</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td data-label="Label" className="adm-col-label">
                  <input
                    name="label"
                    placeholder="Label, e.g. Strava"
                    value={row.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                    className="adm-input"
                  />
                </td>
                <td data-label="Link">
                  <input
                    name="href"
                    placeholder="https://… or /trips"
                    inputMode="url"
                    autoCapitalize="off"
                    autoCorrect="off"
                    value={row.href}
                    onChange={(e) => updateRow(i, { href: e.target.value })}
                    className="adm-input"
                  />
                </td>
                <td data-label="Shows" className="adm-col-shows">
                  {/* Always submits a value, so it stays aligned with the label
                      and href arrays the save reads the rows out of. A native
                      select: the OS picker is a better phone target than
                      anything drawn here. */}
                  <select
                    name="visibleWhen"
                    value={row.visibleWhen ?? "always"}
                    onChange={(e) =>
                      updateRow(i, {
                        visibleWhen: e.target.value as SiteLink["visibleWhen"],
                      })
                    }
                    aria-label={`When to show ${row.label || "this link"}`}
                    className="adm-input"
                  >
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="adm-actions">
                  <div style={{ display: "inline-flex", gap: 4 }}>
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
                      style={{
                        ...SMALL_BTN,
                        opacity: i === rows.length - 1 ? 0.35 : 1,
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      style={SMALL_BTN}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="adm-empty">
            No links. The page will show its heading and nothing else.
          </p>
        )}

        <div className="adm-card-foot">
          <button
            type="button"
            onClick={() =>
              setRows((prev) => [...prev, { label: "", href: "" }])
            }
            style={SMALL_BTN}
          >
            + Add link
          </button>
          <span style={{ flex: 1 }} />
          {result.error && (
            <span className="adm-status" data-tone="error">
              {result.error}
            </span>
          )}
          {flash && result.saved && (
            <span className="adm-status">Saved {result.saved}.</span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="adm-btn"
            data-variant="primary"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
