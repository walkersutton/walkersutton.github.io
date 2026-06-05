import Link from "next/link";

const SEGMENT = "  ·  Walker is currently on trail  ·  View live route ↗  ·  ";

export default function LiveBanner() {
  const text = SEGMENT.repeat(6);

  return (
    <Link
      href="/trips/live"
      style={{ textDecoration: "none", display: "block", overflow: "hidden" }}
    >
      <div
        style={{
          background: "var(--color-text)",
          color: "var(--color-bg)",
          height: 36,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Duplicated so the loop is seamless */}
        <div
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            animation: "live-ticker 150s linear infinite",
          }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span className="trips-live-dot" />
              LIVE
              {text}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
