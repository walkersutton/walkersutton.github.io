"use client";

import { useState } from "react";
import { signOutOtherSessions } from "../actions";

export default function SignOutOthers() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function run() {
    if (!window.confirm("Sign out every other browser and device? This one stays signed in.")) return;
    setBusy(true);
    const result = await signOutOtherSessions();
    setBusy(false);
    setStatus(result.ok ? { tone: "ok", text: "Done. Everywhere else is signed out." } : { tone: "error", text: result.error });
  }

  return (
    <div className="adm-row">
      <div className="adm-row-text">
        <span className="adm-row-label">Everywhere else</span>
        {status ? (
          <span className="adm-status" data-tone={status.tone} role="status">
            {status.text}
          </span>
        ) : (
          <span className="adm-row-hint">For a lost phone or a borrowed computer.</span>
        )}
      </div>
      <button type="button" className="adm-btn" onClick={run} disabled={busy}>
        {busy ? "Signing out…" : "Sign out other sessions"}
      </button>
    </div>
  );
}
