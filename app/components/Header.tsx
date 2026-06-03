"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/trips", label: "Trips" },
  { href: "/services", label: "Services" },
  { href: "/goods", label: "Goods" },
];

export default function Header() {
  const pathname = usePathname();
  const active = NAV_LINKS.find((l) => pathname?.startsWith(l.href))?.href ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="w-full max-w-[1080px] mx-auto">
      <div className="flex items-center gap-6 py-7">
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
          style={{ color: "var(--color-text)" }}
        >
          <span
            className="w-[11px] h-[11px] rounded-full shrink-0"
            style={{ background: "var(--accent)" }}
          />
          <span className="text-[21px] font-[680] tracking-[-0.02em]">
            Walker Sutton
          </span>
        </Link>

        <nav className="ml-auto hidden sm:flex gap-7">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = active === href;
            return (
              <Link
                key={href}
                href={href}
                data-active={isActive}
                className="link-sweep py-1.5 text-[15px] font-medium no-underline transition-colors duration-150"
                style={{
                  color: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-variant)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          className="ml-auto sm:hidden p-1.5 -mr-1"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line
              x1="3" y1="11" x2="19" y2="11"
              style={{
                transformOrigin: "11px 11px",
                transform: menuOpen ? "rotate(45deg)" : "translateY(-4px)",
                transition: "transform 0.25s ease",
              }}
            />
            <line
              x1="3" y1="11" x2="19" y2="11"
              style={{
                transformOrigin: "11px 11px",
                transform: menuOpen ? "rotate(-45deg)" : "translateY(4px)",
                transition: "transform 0.25s ease",
              }}
            />
          </svg>
        </button>
      </div>

      <div className="h-px" style={{ background: "var(--color-border)" }} />

      {menuOpen && (
        <nav className="sm:hidden flex flex-col">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = active === href;
            return (
              <Link
                key={href}
                href={href}
                className="py-4 text-[17px] font-medium no-underline border-b"
                style={{
                  color: isActive ? "var(--color-text)" : "var(--color-text-variant)",
                  borderColor: "var(--color-border-faint)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
