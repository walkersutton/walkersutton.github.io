"use client";

import { useActionState } from "react";
import { saveMapShareSettings } from "../actions";
import { INPUT, BTN } from "../styles";

const initial: { error?: string; saved?: string } = {};

export default function FeedUrlForm({
  current,
  currentStartDate,
}: {
  current: string | null;
  currentStartDate: string | null;
}) {
  const [state, action, pending] = useActionState(saveMapShareSettings, initial);

  return (
    <form action={action} style={{ marginBottom: 28 }}>
      <label
        htmlFor="feedUrl"
        style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-variant)" }}
      >
        MapShare feed URL
      </label>
      <input
        id="feedUrl"
        name="feedUrl"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        defaultValue={current ?? ""}
        placeholder="https://share.garmin.com/Feed/Share/yourname"
        style={{ ...INPUT, width: "100%" }}
      />

      <p style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6, color: "var(--color-text-faint)" }}>
        Paste your MapShare link — <code>share.garmin.com/yourname</code> works too and is
        converted to the feed URL automatically. Saving takes effect within a minute; no
        redeploy needed. Leave empty to fall back to the deployment environment.
      </p>

      <label
        htmlFor="startDate"
        style={{ display: "block", fontSize: 13, marginTop: 18, marginBottom: 6, color: "var(--color-text-variant)" }}
      >
        Trip start date
      </label>
      <input
        id="startDate"
        name="startDate"
        type="date"
        defaultValue={currentStartDate ?? ""}
        style={{ ...INPUT, width: "100%" }}
      />

      <p style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6, color: "var(--color-text-faint)" }}>
        How far back the map reaches. Set this to the day the trip began so the whole route
        stays on the map — Garmin only returns positions inside this window. Leave empty for a
        rolling 7-day window.
      </p>

      {state.error && (
        <p style={{ fontSize: 12, marginTop: 10, color: "var(--accent-red, #c0392b)" }}>
          {state.error}
        </p>
      )}
      {state.saved !== undefined && !state.error && (
        <p style={{ fontSize: 12, marginTop: 10, color: "var(--accent-green, #1a7f4b)" }}>
          Saved. {state.saved}
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        <button type="submit" disabled={pending} style={{ ...BTN(false), opacity: pending ? 0.5 : 1 }}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
