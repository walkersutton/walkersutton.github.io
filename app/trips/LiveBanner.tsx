import Link from "next/link";

export default function LiveBanner({ text }: { text: string }) {
  return (
    <Link
      href="/trips/live"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "var(--color-text)",
          color: "var(--color-bg)",
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.13em]"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <span className="trips-live-dot" />
          {text}
        </span>
      </div>
    </Link>
  );
}
