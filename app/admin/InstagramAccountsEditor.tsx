"use client";

import { useState } from "react";
import type { InstagramAccount } from "@/lib/social-latest";
import { INPUT } from "./styles";

const SMALL_BTN: React.CSSProperties = {
  background: "transparent",
  color: "var(--color-text-faint)",
  border: "1.5px solid var(--color-border-faint)",
  padding: "6px 10px",
  fontSize: 11,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const SAVE_BTN: React.CSSProperties = {
  background: "var(--color-text)",
  color: "var(--color-bg)",
  border: "1.5px solid var(--color-text)",
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

export default function InstagramAccountsEditor({
  action,
  accounts,
}: {
  action: (formData: FormData) => void;
  accounts: InstagramAccount[];
}) {
  const [rows, setRows] = useState<InstagramAccount[]>(
    accounts.length ? accounts : [{ userId: "", accessToken: "", username: "" }],
  );
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  function updateRow(i: number, patch: Partial<InstagramAccount>) {
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { userId: "", accessToken: "", username: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            name="username"
            placeholder="Username"
            value={row.username ?? ""}
            onChange={(e) => updateRow(i, { username: e.target.value })}
            style={{ ...INPUT, flex: 1 }}
          />
          <input
            name="userId"
            placeholder="User ID"
            value={row.userId}
            onChange={(e) => updateRow(i, { userId: e.target.value })}
            style={{ ...INPUT, flex: 1 }}
          />
          <input
            name="accessToken"
            placeholder="Access token"
            type={revealed[i] ? "text" : "password"}
            autoComplete="off"
            value={row.accessToken}
            onChange={(e) => updateRow(i, { accessToken: e.target.value })}
            style={{ ...INPUT, flex: 2 }}
          />
          <button
            type="button"
            onClick={() => setRevealed((prev) => ({ ...prev, [i]: !prev[i] }))}
            style={SMALL_BTN}
          >
            {revealed[i] ? "Hide" : "Show"}
          </button>
          <button type="button" onClick={() => removeRow(i)} style={SMALL_BTN}>
            Remove
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" onClick={addRow} style={SMALL_BTN}>
          + Add account
        </button>
        <button type="submit" style={SAVE_BTN}>
          Save
        </button>
      </div>
    </form>
  );
}
