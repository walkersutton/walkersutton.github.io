"use client";

import { useState } from "react";
import type { InstagramAccount } from "@/lib/social-latest";
import { SMALL_BTN } from "./styles";

export default function InstagramAccountsEditor({
  action,
  accounts,
}: {
  action: (formData: FormData) => void;
  accounts: InstagramAccount[];
}) {
  const [rows, setRows] = useState<InstagramAccount[]>(
    accounts.length
      ? accounts
      : [{ userId: "", accessToken: "", username: "" }],
  );
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  function updateRow(i: number, patch: Partial<InstagramAccount>) {
    setRows((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { userId: "", accessToken: "", username: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={action}>
      <table className="adm-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>User ID</th>
            <th>Access token</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td data-label="Username">
                <input
                  name="username"
                  placeholder="Username"
                  value={row.username ?? ""}
                  onChange={(e) => updateRow(i, { username: e.target.value })}
                  className="adm-input"
                />
              </td>
              <td data-label="User ID">
                <input
                  name="userId"
                  placeholder="User ID"
                  value={row.userId}
                  onChange={(e) => updateRow(i, { userId: e.target.value })}
                  className="adm-input"
                />
              </td>
              <td data-label="Access token">
                <input
                  name="accessToken"
                  placeholder="Access token"
                  type={revealed[i] ? "text" : "password"}
                  autoComplete="off"
                  value={row.accessToken}
                  onChange={(e) =>
                    updateRow(i, { accessToken: e.target.value })
                  }
                  className="adm-input"
                />
              </td>
              <td className="adm-actions">
                <div style={{ display: "inline-flex", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((prev) => ({ ...prev, [i]: !prev[i] }))
                    }
                    style={SMALL_BTN}
                  >
                    {revealed[i] ? "Hide" : "Show"}
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
      <div className="adm-card-foot">
        <button type="button" onClick={addRow} style={SMALL_BTN}>
          + Add account
        </button>
        <span style={{ flex: 1 }} />
        <button type="submit" className="adm-btn" data-variant="primary">
          Save
        </button>
      </div>
    </form>
  );
}
