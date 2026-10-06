// Inline counterparts of the classes in admin.css, for the editors that build
// their styles in JS. Keep the two in step: same radius, borders and type.

export const INPUT: React.CSSProperties = {
  // Without this, a flex row sizes the field to its content and pushes whatever
  // follows — usually the Save button — off the side of a phone screen.
  minWidth: 0,
  fontSize: 14,
  fontFamily: "inherit",
  padding: "9px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  background: "var(--color-bg)",
  color: "var(--color-text)",
};

// 40px tall so it stays a comfortable thumb target on a phone.
export const BTN = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  background: active ? "var(--color-text)" : "var(--adm-surface)",
  color: active ? "var(--color-bg)" : "var(--color-text)",
  border: `1px solid ${active ? "var(--color-text)" : "var(--color-border)"}`,
  borderRadius: 8,
  padding: "0 14px",
  minHeight: 40,
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
});

// Secondary actions inside a card: add, remove, reorder, reveal.
export const SMALL_BTN: React.CSSProperties = {
  background: "transparent",
  color: "var(--color-text-variant)",
  border: "1px solid var(--color-border-faint)",
  borderRadius: 8,
  minHeight: 36,
  minWidth: 40,
  padding: "0 12px",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "inherit",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
