"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "General" },
  { href: "/admin/latest", label: "Latest" },
];

const TAB_LINK = (active: boolean): React.CSSProperties => ({
  borderBottom: active ? "2px solid var(--color-text)" : "2px solid transparent",
  padding: "8px 4px",
  marginRight: 24,
  fontSize: 12,
  fontWeight: 600,
  color: active ? "var(--color-text)" : "var(--color-text-variant)",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  textDecoration: "none",
});

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        marginBottom: 24,
        borderBottom: "1px solid var(--color-border-faint)",
      }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} style={TAB_LINK(!!active)}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
