"use client";

import { useOptimistic, useState, useTransition } from "react";

type Props = {
  label: string;
  hint?: string;
  checked: boolean;
  action: (enabled: boolean) => Promise<void>;
};

/**
 * A settings switch that moves the moment it's tapped. The server action runs
 * behind it; if it throws, the optimistic state falls back to what the server
 * last rendered and the row says the change didn't stick.
 */
export default function ToggleRow({ label, hint, checked, action }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle() {
    const next = !optimistic;
    setError(false);
    startTransition(async () => {
      setOptimistic(next);
      try {
        await action(next);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="adm-row">
      <div className="adm-row-text">
        <span className="adm-row-label">{label}</span>
        {error ? (
          <span className="adm-status" data-tone="error">Couldn&apos;t save — try again</span>
        ) : (
          hint && <span className="adm-row-hint">{hint}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label={label}
        aria-busy={pending}
        onClick={toggle}
        className="adm-switch"
      />
    </div>
  );
}
