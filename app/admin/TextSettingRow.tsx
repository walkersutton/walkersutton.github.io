"use client";

import { useActionState, useEffect, useState } from "react";
import { ROW, LABEL, INPUT, BTN } from "./styles";
import type { SaveResult } from "./types";

type Props = {
  label: string;
  name: string;
  value: string;
  action: (prev: SaveResult, formData: FormData) => Promise<SaveResult>;
  placeholder?: string;
  last?: boolean;
};

/**
 * A one-field settings row that keeps what you typed.
 *
 * React resets an uncontrolled form once its action resolves, so the field
 * repaints from whatever the server just re-rendered. When that render read
 * stale state the save looked like it had silently reverted, with no way to
 * tell that apart from a save that never happened. Holding the value in React
 * state means the field only ever changes because you changed it, and the
 * result of the save is stated outright rather than inferred from the input.
 */
export default function TextSettingRow({
  label,
  name,
  value: initialValue,
  action,
  placeholder,
  last,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [result, formAction, pending] = useActionState<SaveResult, FormData>(action, {});
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!result.saved) return;
    // Trust the stored value over the typed one — it's been trimmed.
    setValue(result.saved);
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 4000);
    return () => clearTimeout(timer);
  }, [result]);

  const dirty = value !== initialValue;

  return (
    <form action={formAction} style={last ? { ...ROW, borderBottom: "none" } : ROW}>
      <span style={LABEL}>{label}</span>
      <input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ ...INPUT, flex: 1 }}
      />
      <button type="submit" disabled={pending} style={{ ...BTN(false), opacity: pending ? 0.5 : 1 }}>
        {pending ? "Saving…" : "Save"}
      </button>
      <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
        {result.error ? (
          <span style={{ color: "var(--accent-red, #c0392b)" }}>{result.error}</span>
        ) : flash ? (
          "Saved"
        ) : dirty ? (
          "Unsaved"
        ) : null}
      </span>
    </form>
  );
}
