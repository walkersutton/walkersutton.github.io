"use client";

import { useState } from "react";
import { restoreMissingReportEntries } from "../actions";
import { BTN } from "../styles";

/**
 * Shown only when the archive holds updates the report doesn't. That gap means
 * something dropped them — a save that raced another, a store that didn't
 * answer — and this is the one tap that puts them back.
 */
export default function ReportRecovery({ missing }: { missing: number }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStatus(null);

    const result = await restoreMissingReportEntries();
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(
      result.restored === 0
        ? "Nothing to put back — the report already has every update."
        : `Put back ${result.restored} update${result.restored === 1 ? "" : "s"}.`,
    );
  }

  return (
    <div
      style={{
        marginBottom: 24,
        padding: "14px 16px",
        borderRadius: 6,
        border: "1px solid var(--color-border-faint)",
        background: "var(--color-surface-raised, transparent)",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--color-text)", marginBottom: 10 }}>
        {missing} published update{missing === 1 ? " is" : "s are"} backed up but missing from the
        report.
      </div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{ ...BTN(false), opacity: busy ? 0.5 : 1 }}
      >
        {busy ? "Restoring…" : "Restore them"}
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
