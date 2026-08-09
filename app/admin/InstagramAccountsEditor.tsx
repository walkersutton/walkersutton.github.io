"use client";

import { useState } from "react";
import type { InstagramAccount } from "@/lib/social-latest";
import { INPUT, BTN, FIELD_GRID } from "./styles";

const SMALL_BTN: React.CSSProperties = {
  background: "transparent",
  color: "var(--color-text-faint)",
  border: "1.5px solid var(--color-border-faint)",
  padding: "0 12px",
  minHeight: 40,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
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
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* One card per account. Five controls on a single row ran off the side of
          a phone; the fields reflow to one column and the buttons sit under
          them, while a wide screen still gets the row it had. */}
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
          <div style={FIELD_GRID}>
            <input
              name="username"
              placeholder="Username"
              value={row.username ?? ""}
              onChange={(e) => updateRow(i, { username: e.target.value })}
              style={INPUT}
            />
            <input
              name="userId"
              placeholder="User ID"
              value={row.userId}
              onChange={(e) => updateRow(i, { userId: e.target.value })}
              style={INPUT}
            />
            <input
              name="accessToken"
              placeholder="Access token"
              type={revealed[i] ? "text" : "password"}
              autoComplete="off"
              value={row.accessToken}
              onChange={(e) => updateRow(i, { accessToken: e.target.value })}
              style={INPUT}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={addRow} style={SMALL_BTN}>
          + Add account
        </button>
        <button type="submit" style={BTN(true)}>
          Save
        </button>
      </div>
    </form>
  );
}
