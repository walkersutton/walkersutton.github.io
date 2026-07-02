export const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
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
  fontSize: 12,
  fontFamily: "inherit",
  padding: "6px 10px",
  border: "1.5px solid var(--color-text)",
  background: "transparent",
  color: "var(--color-text)",
};

export const BTN = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--color-text)" : "transparent",
  color: active ? "var(--color-bg)" : "var(--color-text)",
  border: "1.5px solid var(--color-text)",
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
});
