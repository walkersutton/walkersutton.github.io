"use client";

import { useState } from "react";
import { shrinkReportPhotosBatch } from "../actions";
import { BTN } from "../styles";

const MB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

/** Stop rather than loop forever if a pass keeps reporting work left to do. */
const MAX_PASSES = 40;

/**
 * Runs the photo backfill a batch at a time (see lib/report-photos.ts). Each
 * batch is its own server round trip, so a dropped connection on the trail
 * costs at most the batch in flight — everything already converted is saved.
 */
export default function ShrinkPhotosButton() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStatus("Checking photos…");

    let converted = 0;
    let saved = 0;
    try {
      for (let pass = 0; pass < MAX_PASSES; pass++) {
        const result = await shrinkReportPhotosBatch();
        if (!result.ok) {
          setError(result.error);
          break;
        }
        // A pass that converts nothing means everything left is already as
        // small as it is going to get.
        if (result.converted === 0) break;

        converted += result.converted;
        saved += result.saved;
        setStatus(
          `Shrunk ${converted} photo${converted === 1 ? "" : "s"}, saved ${MB(saved)}` +
            (result.remaining > 0 ? ` — ${result.remaining} to go…` : "…"),
        );
      }

      setStatus(
        converted === 0
          ? "Nothing to shrink — every photo is already small."
          : `Done. Shrunk ${converted} photo${converted === 1 ? "" : "s"} and saved ${MB(saved)} per read of the report.`,
      );
    } catch (err) {
      setError((err as Error).message || "Could not shrink photos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{ ...BTN(false), opacity: busy ? 0.5 : 1 }}
      >
        {busy ? "Shrinking…" : "Shrink old photos"}
      </button>

      {(status || error) && (
        <div
          style={{
            fontSize: 13,
            marginTop: 10,
            color: error ? "var(--accent-red, #c0392b)" : "var(--color-text-faint)",
          }}
        >
          {error ?? status}
        </div>
      )}
    </div>
  );
}
