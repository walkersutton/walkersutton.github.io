import { getLiveReportEntries } from "@/lib/live-state";
import { clearReportEntries } from "../actions";
import ReportEditor from "./ReportEditor";
import ReportEntryItem from "./ReportEntryItem";

export const dynamic = "force-dynamic";

export default async function AdminReportPage() {
  const entries = await getLiveReportEntries();

  return (
    <div>
      <ReportEditor />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "1px solid var(--color-border-faint)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            color: "var(--color-text-faint)",
          }}
        >
          {entries.length} update{entries.length !== 1 ? "s" : ""}
        </span>
        {entries.length > 0 && (
          <form action={clearReportEntries}>
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
        )}
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-faint)" }}>No updates yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {entries.map((entry) => (
            <ReportEntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
