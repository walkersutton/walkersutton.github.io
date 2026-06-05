import Link from "next/link";

export default function LiveBanner({ text }: { text: string }) {
  // const segment = `  ·  ${text}  ·  View live route ↗  ·  `;
  const segment = text;
  const ticker = segment.repeat(25);

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
            whiteSpace: "pre",
            animation: "live-ticker 100s linear infinite",
          }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span className="trips-live-dot" />
              {/* LIVE */}
              {ticker}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
