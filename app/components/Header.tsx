"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/trips", label: "Trips" },
  { href: "/work", label: "Work" },
  { href: "/goods", label: "Goods" },
];

interface HeaderProps {
  variant?: "glass";
  topOffset?: number;
  sticky?: boolean;
}

export default function Header({
  variant,
  topOffset = 0,
  sticky = false,
}: HeaderProps = {}) {
  const isGlass = variant === "glass";
  const pathname = usePathname();
  const active =
    NAV_LINKS.find((l) => pathname?.startsWith(l.href))?.href ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const indicatorPosRef = useRef({ left: 0, width: 0 });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function setIndicator(left: number, width: number, transition: string) {
    const ind = indicatorRef.current;
    if (!ind) return;
    indicatorPosRef.current = { left, width };
    ind.style.transition = transition;
    ind.style.width = width + "px";
    ind.style.transform = `translateX(${left}px)`;
    ind.style.boxShadow = "2px 2px 0 0 var(--color-text)";
    ind.style.opacity = "1";
  }

  function pressIndicator() {
    const ind = indicatorRef.current;
    if (!ind) return;
    const { left } = indicatorPosRef.current;
    ind.style.transition = "transform 0.07s ease, box-shadow 0.07s ease";
    ind.style.transform = `translateX(${left + 2}px) translateY(2px)`;
    ind.style.boxShadow = "0 0 0 0 var(--color-text)";
  }

  function releaseIndicator() {
    const ind = indicatorRef.current;
    if (!ind) return;
    const { left, width } = indicatorPosRef.current;
    ind.style.transition = "transform 0.1s ease, box-shadow 0.1s ease";
    ind.style.transform = `translateX(${left}px)`;
    ind.style.width = width + "px";
    ind.style.boxShadow = "2px 2px 0 0 var(--color-text)";
  }

  function moveIndicatorTo(el: HTMLElement, _depressOnSettle: boolean = false) {
    const nav = navRef.current;
    const ind = indicatorRef.current;
    if (!nav || !ind || !el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetLeft = elRect.left - navRect.left;
    const targetWidth = elRect.width;

    if (!initializedRef.current) {
      setIndicator(targetLeft, targetWidth, "none");
      initializedRef.current = true;
      return;
    }
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    const indRect = ind.getBoundingClientRect();
    const curLeft = indRect.left - navRect.left;
    const curWidth = indRect.width;
    const stretchLeft = Math.min(curLeft, targetLeft);
    const stretchRight = Math.max(curLeft + curWidth, targetLeft + targetWidth);
    setIndicator(
      stretchLeft,
      stretchRight - stretchLeft,
      "transform 0.18s ease, width 0.18s ease",
    );
    pendingTimerRef.current = setTimeout(() => {
      setIndicator(
        targetLeft,
        targetWidth,
        "transform 0.16s ease, width 0.16s ease",
      );
      pendingTimerRef.current = null;
    }, 170);
  }

  useEffect(() => {
    const nav = navRef.current;
    const ind = indicatorRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector<HTMLElement>(`[data-href="${active}"]`);
    if (activeBtn) {
      initializedRef.current = false;
      requestAnimationFrame(() => moveIndicatorTo(activeBtn, false));
    } else if (ind) {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      initializedRef.current = false;
      ind.style.transition = "none";
      ind.style.opacity = "0";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const logo = (
    <Link
      href="/"
      className="flex items-center gap-[9px] no-underline shrink-0"
      style={{ color: "var(--color-text)" }}
    >
      <svg
        viewBox="0 0 100 115"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: 19, height: 22, flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d="M50 6 C25 6 5 26 5 51 C5 68 14 82 27 89.5 L27 111 L35 111 L65 111 L73 111 L73 89.5 C86 82 95 68 95 51 C95 26 75 6 50 6Z"
          fill="currentColor"
        />
        <ellipse cx="33" cy="53" rx="10" ry="10" fill="var(--color-bg)" />
        <ellipse cx="67" cy="53" rx="10" ry="10" fill="var(--color-bg)" />
      </svg>
      <span className="text-[21px] font-[680] tracking-[-0.02em]">
        Walker Sutton
      </span>
    </Link>
  );

  const desktopNav = (
    <nav
      ref={navRef}
      className="ml-auto hidden sm:flex gap-1 relative"
      onMouseEnter={() => {
        if (!active) initializedRef.current = false;
      }}
      onMouseLeave={() => {
        const nav = navRef.current;
        const ind = indicatorRef.current;
        if (!nav) return;
        const activeBtn = nav.querySelector<HTMLElement>(
          `[data-href="${active}"]`,
        );
        if (activeBtn) {
          moveIndicatorTo(activeBtn, false);
        } else if (ind) {
          if (pendingTimerRef.current) {
            clearTimeout(pendingTimerRef.current);
            pendingTimerRef.current = null;
          }
          ind.style.transition = "opacity 0.15s ease";
          ind.style.opacity = "0";
        }
      }}
    >
      <div
        ref={indicatorRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          border: "1px solid var(--color-text)",
          boxShadow: "2px 2px 0 0 var(--color-text)",
          top: 0,
          left: 0,
          height: "100%",
          opacity: 0,
        }}
      />
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = active === href;
        return (
          <Link
            key={href}
            href={href}
            data-href={href}
            data-active={isActive}
            className="text-[13px] font-medium no-underline transition-colors duration-150"
            style={{
              padding: "4px 10px",
              color: "var(--color-text)",
              position: "relative",
              zIndex: 1,
            }}
            onMouseEnter={(e) => moveIndicatorTo(e.currentTarget)}
            onMouseDown={pressIndicator}
            onMouseUp={releaseIndicator}
            onMouseLeave={releaseIndicator}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );

  if (isGlass) {
    return (
      <div
        className={`${sticky ? "sticky" : "absolute"} left-0 right-0 z-20`}
        style={{
          top: topOffset,
          // background: "rgba(var(--header-glass-rgb), 0.86)",
          background: "rgba(var(--header-glass-rgb), 0.69)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="px-4 md:px-8">
          <div className="w-full max-w-[1080px] mx-auto flex items-center gap-6 h-[70px]">
            {logo}
            {desktopNav}
            <button
              className="ml-auto sm:hidden p-1.5 -mr-1"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line
                  x1="3"
                  y1="11"
                  x2="19"
                  y2="11"
                  style={{
                    transformOrigin: "11px 11px",
                    transform: menuOpen ? "rotate(45deg)" : "translateY(-4px)",
                    transition: "transform 0.25s ease",
                  }}
                />
                <line
                  x1="3"
                  y1="11"
                  x2="19"
                  y2="11"
                  style={{
                    transformOrigin: "11px 11px",
                    transform: menuOpen ? "rotate(-45deg)" : "translateY(4px)",
                    transition: "transform 0.25s ease",
                  }}
                />
              </svg>
            </button>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--color-border-faint)" }} />
        {menuOpen && (
          <nav className="sm:hidden flex flex-col px-4 md:px-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="py-4 text-[17px] font-medium no-underline border-b"
                style={{
                  color: "var(--color-text-variant)",
                  borderColor: "var(--color-border-faint)",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    );
  }

  return (
    <header className="w-full max-w-[1080px] mx-auto">
      <div className="flex items-center gap-6 h-[70px]">
        {logo}
        {desktopNav}

        <button
          className="ml-auto sm:hidden p-1.5 -mr-1"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line
              x1="3"
              y1="11"
              x2="19"
              y2="11"
              style={{
                transformOrigin: "11px 11px",
                transform: menuOpen ? "rotate(45deg)" : "translateY(-4px)",
                transition: "transform 0.25s ease",
              }}
            />
            <line
              x1="3"
              y1="11"
              x2="19"
              y2="11"
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
            return (
              <Link
                key={href}
                href={href}
                className="py-4 text-[17px] font-medium no-underline border-b"
                style={{
                  color: "var(--color-text-variant)",
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
