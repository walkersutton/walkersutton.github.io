"use client";

import { useActionState, useEffect, useState } from "react";
import type { SaveResult } from "./types";

type Props = {
  label: string;
  name: string;
  value: string;
  action: (prev: SaveResult, formData: FormData) => Promise<SaveResult>;
  placeholder?: string;
  hint?: string;
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
  hint,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [savedValue, setSavedValue] = useState(initialValue);
  const [result, formAction, pending] = useActionState<SaveResult, FormData>(action, {});
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!result.saved) return;
    // Trust the stored value over the typed one — it's been trimmed.
    setValue(result.saved);
    setSavedValue(result.saved);
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 2500);
    return () => clearTimeout(timer);
  }, [result]);

  const dirty = value !== savedValue;

  return (
    <form action={formAction} className="adm-row" style={{ alignItems: "flex-start" }}>
      <label className="adm-row-text" style={{ flexBasis: "100%" }}>
        <span className="adm-row-label">{label}</span>
        {hint && <span className="adm-row-hint">{hint}</span>}
      </label>
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="adm-input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={pending || !dirty}
          className="adm-btn"
          data-variant={dirty ? "primary" : undefined}
        >
          {pending ? "Saving…" : flash ? "Saved" : "Save"}
        </button>
      </div>
      {result.error && (
        <span className="adm-status" data-tone="error">
          {result.error}
        </span>
      )}
    </form>
  );
}
