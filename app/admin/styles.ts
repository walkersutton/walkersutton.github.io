export const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16,
  padding: "14px 0",
  borderBottom: "1px solid var(--color-border-faint)",
};

export const LABEL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--color-text-variant)",
  minWidth: 120,
};

export const INPUT: React.CSSProperties = {
  // Without this, a flex row sizes the field to its content and pushes whatever
  // follows — usually the Save button — off the side of a phone screen.
  minWidth: 0,
  fontSize: 12,
  fontFamily: "inherit",
  padding: "6px 10px",
  border: "1.5px solid var(--color-text)",
  background: "transparent",
  color: "var(--color-text)",
};

// 44px tall so it stays a comfortable thumb target on a phone.
export const BTN = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--color-text)" : "transparent",
  color: active ? "var(--color-bg)" : "var(--color-text)",
  border: "1.5px solid var(--color-text)",
  padding: "0 18px",
  minHeight: 44,
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
});
