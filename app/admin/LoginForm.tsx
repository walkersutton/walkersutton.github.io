"use client";

import { useActionState } from "react";
import { login } from "./actions";

const initial = { error: undefined as string | undefined };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 280 }}>
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        required
        style={{
          background: "var(--color-bg)",
          color: "var(--color-text)",
          border: "1.5px solid var(--color-text)",
          padding: "8px 10px",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
        }}
      />
      {state?.error && (
        <span style={{ fontSize: 12, color: "var(--accent-red, #e05)" }}>{state.error}</span>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{
          background: "var(--color-text)",
          color: "var(--color-bg)",
          border: "none",
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: pending ? "wait" : "pointer",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
