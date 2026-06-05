import Link from "next/link";

export default function Banner({ text, href }: { text: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
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
          {text}
        </span>
      </div>
    </Link>
  );
}
