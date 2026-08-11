"use client";

import { useState } from "react";
import { listReportPhotosToShrink, replaceReportPhotoUrl } from "../actions";
import { BTN } from "../styles";
import { shrinkExistingPhoto } from "./upload-images";

const MB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

/**
 * Works through the photos already in the store, one at a time: fetch,
 * re-encode here, upload the smaller copy, repoint the report at it.
 *
 * Each photo is committed on its own, so losing signal halfway through costs
 * only the photo in flight — tap again later and it picks up where it stopped,
 * because a converted photo no longer counts as oversized.
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

    try {
      const listed = await listReportPhotosToShrink();
      if (!listed.ok) {
        setError(listed.error);
        return;
      }
      if (listed.photos.length === 0) {
        setStatus("Nothing to shrink — every photo is already small.");
        return;
      }

      let done = 0;
      let saved = 0;
      let skipped = 0;

      for (const [i, photo] of listed.photos.entries()) {
        setStatus(`Shrinking photo ${i + 1} of ${listed.photos.length}…`);
        const result = await shrinkExistingPhoto(photo.url);
        if (!result) {
          skipped++;
          continue;
        }

        const saveResult = await replaceReportPhotoUrl(photo.url, result.url);
        if (!saveResult.ok) {
          setError(saveResult.error);
          return;
        }
        done++;
        saved += result.saved;
      }

      setStatus(
        done === 0
          ? "Nothing to shrink — every photo is already as small as it gets."
          : `Done. Shrunk ${done} photo${done === 1 ? "" : "s"}, saving ${MB(saved)} per read of the report` +
              (skipped > 0 ? `. ${skipped} already small enough.` : "."),
      );
    } catch (err) {
      // Whatever was converted before this point is already saved.
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
