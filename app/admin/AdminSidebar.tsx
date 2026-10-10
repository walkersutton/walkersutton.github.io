"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SkullLogo from "../components/SkullLogo";
import { SITE_CONFIG } from "@/lib/config";
import { logout } from "./actions";

// 16px line icons, drawn on a 24px grid so they share one stroke weight.
const ICONS = {
  general: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  links: (
    <>
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </>
  ),
  latest: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  report: (
    <>
      <path d="M12 20h8" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  mapshare: (
    <>
      <path d="M12 21s-6-5.33-6-11a6 6 0 0 1 12 0c0 5.67-6 11-6 11z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  subscribers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.66-4.8-4-5.6" />
    </>
  ),
  security: (
    <>
      <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6z" />
      <path d="m9.5 12 1.8 1.8 3.5-3.6" />
    </>
  ),
  site: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" />
    </>
  ),
  signOut: (
    <>
      <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
      <path d="M16 16l4-4-4-4" />
      <path d="M20 12H10" />
    </>
  ),
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

const GROUPS: { title: string; items: { href: string; label: string; icon: keyof typeof ICONS }[] }[] = [
  {
    title: "Site",
    items: [
      { href: "/admin", label: "General", icon: "general" },
      { href: "/admin/latest", label: "Latest", icon: "latest" },
      { href: "/admin/links", label: "Links", icon: "links" },
    ],
  },
  {
    title: "Trip",
    items: [
      { href: "/admin/report", label: "Log", icon: "report" },
      { href: "/admin/mapshare", label: "MapShare", icon: "mapshare" },
    ],
  },
  {
    title: "Audience",
    items: [{ href: "/admin/subscribers", label: "Subscribers", icon: "subscribers" }],
  },
  {
    title: "Account",
    items: [{ href: "/admin/security", label: "Security", icon: "security" }],
  },
];

function isActive(href: string, pathname: string | null): boolean {
  return href === "/admin" ? pathname === "/admin" : !!pathname?.startsWith(href);
}

const HOST = new URL(SITE_CONFIG.siteUrl).host;

/**
 * The admin navigation. On a desktop it's a fixed sidebar; on a phone it
 * folds into a slim top bar — skull, the page you're on, and a menu button
 * that drops the same grouped list down over the page.
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  // null until the menu has been used. The closing fade is keyed to an
  // explicit false, so when the layout itself switches — a tablet rotating
  // across the breakpoint — the sidebar's contents don't fade out as if a
  // menu nobody opened were closing.
  const [open, setOpen] = useState<boolean | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const current = GROUPS.flatMap((group) => group.items).find((item) =>
    isActive(item.href, pathname),
  );

  // Crossing the phone breakpoint either way puts the menu back to unused,
  // which also drops the scroll lock below if it was open at the time.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 861px)");
    const reset = () => setOpen(null);
    desktop.addEventListener("change", reset);
    return () => desktop.removeEventListener("change", reset);
  }, []);

  // While the phone menu is open: Escape closes it and the page behind it
  // can't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <aside className="adm-side" data-open={open ?? undefined}>
        <div className="adm-side-top">
          {/* The word sits inside the link, as on the site header, so hovering
              it brings the crossbones out too. */}
          <SkullLogo href="/admin" width={24} className="adm-brand">
            <span className="adm-brand-name">Admin</span>
          </SkullLogo>
          {current && (
            <span className="adm-side-current">
              <span className="adm-side-sep" aria-hidden>
                /
              </span>
              {current.label}
            </span>
          )}
          <button
            ref={buttonRef}
            type="button"
            className="adm-menu-btn"
            aria-expanded={!!open}
            aria-controls="adm-side-panel"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className="adm-menu-icon" aria-hidden>
              <span />
              <span />
            </span>
          </button>
        </div>

        <div id="adm-side-panel" className="adm-side-panel">
          <nav className="adm-nav" aria-label="Admin sections">
            {GROUPS.map((group) => (
              <div key={group.title} className="adm-nav-group">
                <div className="adm-nav-title">{group.title}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href, pathname) ? "page" : undefined}
                    className="adm-nav-item"
                    onClick={close}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* Sign out rides at the end of the site row on a desktop — an icon
              with a tooltip, out of the way of the links above — and becomes
              its own labelled row in the phone menu, where there's no hover
              to explain an icon. */}
          <div className="adm-side-foot">
            <a href="/" target="_blank" rel="noreferrer" className="adm-side-link" onClick={close}>
              <Icon name="site" />
              <span className="adm-side-link-label">
                <span className="adm-side-link-text">{HOST}</span>
                <span className="adm-side-ext" aria-hidden>
                  ↗
                </span>
              </span>
            </a>
            <form action={logout} className="adm-signout-form">
              <button type="submit" className="adm-signout" data-tip="Sign out">
                <Icon name="signOut" />
                <span className="adm-signout-label">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Outside the <aside>: its backdrop-filter would otherwise become the
          containing block for this fixed layer and shrink it to the bar. */}
      <div className="adm-scrim" data-open={open ?? undefined} onClick={close} aria-hidden />
    </>
  );
}
