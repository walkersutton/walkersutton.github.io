"use client";

import { useState } from "react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { deletePasskey, finishPasskeyRegistration, startPasskeyRegistration } from "../actions";

export type PasskeyRow = { id: string; title: string; detail: string; synced: boolean };

type Status = { tone: "ok" | "error"; text: string } | null;

export default function PasskeyList({
  rows,
  canAdd,
  cantAddReason,
  lastWarning,
}: {
  rows: PasskeyRow[];
  canAdd: boolean;
  cantAddReason: string;
  /** What removing the only passkey would do, if anything worth saying. */
  lastWarning: string | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function add() {
    if (!browserSupportsWebAuthn()) {
      setStatus({ tone: "error", text: "This browser doesn't support passkeys." });
      return;
    }
    setBusy("add");
    setStatus(null);
    try {
      const start = await startPasskeyRegistration();
      if (!start.ok) throw new Error(start.error);
      const response = await startRegistration({ optionsJSON: start.options });
      const done = await finishPasskeyRegistration(response);
      if (!done.ok) throw new Error(done.error);
      setStatus({ tone: "ok", text: "Passkey added. Next time, sign in with it." });
    } catch (error) {
      const { name, message, code } = error as Error & { code?: string };
      if (name === "NotAllowedError" || name === "AbortError") return;
      setStatus({
        tone: "error",
        text:
          code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
            ? "This device already has a passkey here."
            : message || "Couldn't add a passkey.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: PasskeyRow) {
    const last = rows.length === 1 && lastWarning ? ` ${lastWarning}` : "";
    if (!window.confirm(`Remove “${row.title}”? It will stop working for this admin.${last}`)) return;
    setBusy(row.id);
    setStatus(null);
    const result = await deletePasskey(row.id);
    setBusy(null);
    setStatus(result.ok ? { tone: "ok", text: "Removed. Other sessions were signed out." } : { tone: "error", text: result.error });
  }

  return (
    <div className="adm-card">
      {rows.length === 0 ? (
        <div className="adm-row">
          <div className="adm-row-text">
            <span className="adm-row-label">No passkeys yet</span>
            <span className="adm-row-hint">
              Add one to sign in with Face ID or Touch ID instead of the password.
            </span>
          </div>
        </div>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="adm-row">
            <span className="adm-passkey-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="15" r="4" />
                <path d="M10.8 12.2 19 4M16 7l2.5 2.5M13.5 9.5 16 12" />
              </svg>
            </span>
            <div className="adm-row-text">
              <span className="adm-row-label">
                {row.title}
                {row.synced && (
                  <span className="adm-pill" data-tone="ok" style={{ marginLeft: 8 }}>
                    Synced
                  </span>
                )}
              </span>
              <span className="adm-row-hint">{row.detail}</span>
            </div>
            <button
              type="button"
              className="adm-btn"
              data-variant="quiet"
              onClick={() => remove(row)}
              disabled={busy !== null}
            >
              {busy === row.id ? "Removing…" : "Remove"}
            </button>
          </div>
        ))
      )}
      <div className="adm-card-foot">
        {canAdd ? (
          <button type="button" className="adm-btn" data-variant="primary" onClick={add} disabled={busy !== null}>
            {busy === "add" ? "Waiting for your device…" : "Add a passkey"}
          </button>
        ) : (
          <span className="adm-row-hint">{cantAddReason}</span>
        )}
        {status && (
          <span className="adm-status" data-tone={status.tone} role="status">
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}
