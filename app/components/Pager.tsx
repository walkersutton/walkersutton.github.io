import Link from "next/link";

// Padded rather than bare words: these are the only tap targets at the foot of
// a long scroll on a phone.
const LINK: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--color-text-faint)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  padding: "10px 0",
};

/**
 * Newer/older pagination for the trip report, on both the public page and the
 * admin list. Nothing renders for a single page, so a short trip looks exactly
 * as it did before there was any paging.
 */
export default function Pager({
  currentPage,
  totalPages,
  hrefFor,
  label = "Pages",
}: {
  currentPage: number;
  totalPages: number;
  /** Page 1 should map to the bare URL, so the link everyone has keeps working. */
  hrefFor: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginTop: 40,
        paddingTop: 20,
        borderTop: "1px solid var(--color-border-faint)",
      }}
    >
      {/* The empty spans hold the ends of the row, so "Page 2 of 5" stays
          centred whether or not both links are there. */}
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} style={LINK}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} style={LINK}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
