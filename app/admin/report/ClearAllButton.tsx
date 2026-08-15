"use client";

import { clearReportEntries } from "../actions";

/**
 * "Clear all" sits a thumb-width from the paging controls on a page that is
 * only ever used one-handed, and it takes the archive down with it — there is
 * nothing behind it to restore from. It gets a confirm, and one that says how
 * many updates are about to go.
 */
export default function ClearAllButton({ count }: { count: number }) {
  return (
    <form
      action={clearReportEntries}
      onSubmit={(e) => {
        const message =
          `Delete all ${count} update${count === 1 ? "" : "s"}? ` +
          `This also empties the backup, so it cannot be undone.`;
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        style={{
          background: "none",
          border: "none",
          padding: "8px 2px",
          fontSize: 13,
          color: "var(--color-text-faint)",
          cursor: "pointer",
          fontFamily: "inherit",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Clear all
      </button>
    </form>
  );
}
