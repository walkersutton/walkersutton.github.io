"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/trips", label: "Trips" },
  { href: "/work", label: "My Work" },
  { href: "/goods", label: "Goods" },
];

interface HeaderProps {
  topOffset?: number;
  sticky?: boolean;
  homeGlass?: boolean;
}

export default function Header({
  topOffset = 0,
  sticky = false,
  homeGlass = false,
}: HeaderProps = {}) {
  const pathname = usePathname();
  const active =
    NAV_LINKS.find((l) => pathname?.startsWith(l.href))?.href ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [bonesPhase, setBonesPhase] = useState<"spin" | "retract" | null>(null);
  const hoveringLogoRef = useRef(false);

  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
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

  function moveIndicatorTo(el: HTMLElement) {
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
    // Slide straight to the target in one smooth move — no stretch-and-settle.
    setIndicator(
      targetLeft,
      targetWidth,
      "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), width 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
    );
  }

  useEffect(() => {
    const nav = navRef.current;
    const ind = indicatorRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector<HTMLElement>(`[data-href="${active}"]`);
    if (activeBtn) {
      initializedRef.current = false;
      requestAnimationFrame(() => moveIndicatorTo(activeBtn));
    } else if (ind) {
      initializedRef.current = false;
      ind.style.transition = "none";
      ind.style.opacity = "0";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // The single persistent header goes glass on trips routes and on the home page
  // while live, so it overlays the full-bleed maps (trips overview, live map,
  // home hero) rather than each view embedding its own instance — this keeps the
  // crossbones <g> and nav indicator mounted across all navigation.
  const isGlass =
    !!pathname?.startsWith("/trips") || (homeGlass && pathname === "/");
  // Glass headers stick to the top; non-glass headers defer to the sticky prop.
  const isSticky = sticky || isGlass;

  const logo = (
    <Link
      href="/"
      className="logo-link flex items-center gap-[9px] no-underline shrink-0"
      style={{ color: "var(--color-text)" }}
      onClick={() => setBonesPhase("spin")}
      onMouseEnter={() => { hoveringLogoRef.current = true; }}
      onMouseLeave={() => { hoveringLogoRef.current = false; }}
    >
      <svg
        viewBox="0 0 100 115"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: 19, height: 22, flexShrink: 0, overflow: "visible" }}
        aria-hidden="true"
      >
        <g
          className={`crossbones${bonesPhase === "spin" ? " spin" : ""}${bonesPhase === "retract" ? " retract" : ""}`}
          onAnimationEnd={() =>
            setBonesPhase((prev) =>
              // After the spin: if the cursor left, hand off to the retract
              // animation; otherwise the :hover rule holds the bones out.
              prev === "spin" && !hoveringLogoRef.current ? "retract" : null,
            )
          }
        >
          <line x1="-15" y1="15" x2="115" y2="105" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
          <circle cx="-15" cy="15" r="13" fill="currentColor" />
          <circle cx="115" cy="105" r="13" fill="currentColor" />
          <line x1="115" y1="15" x2="-15" y2="105" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
          <circle cx="115" cy="15" r="13" fill="currentColor" />
          <circle cx="-15" cy="105" r="13" fill="currentColor" />
        </g>
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
          moveIndicatorTo(activeBtn);
        } else if (ind) {
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

  const mobileMenuButton = (
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
  );

  // Unified DOM structure: both glass and non-glass use identical element types at
  // every depth so React reconciles in place on mode change. This keeps the
  // crossbones <g> element mounted through navigation, preserving CSS animations.
  return (
    <>
      <div
        className={isGlass
          ? `${isSticky ? "sticky" : "absolute"} left-0 right-0 z-[55] -mx-4 md:-mx-8`
          : undefined}
        style={isGlass
          ? {
              top: topOffset,
              background: "rgba(var(--header-glass-rgb), 0.69)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }
          : undefined}
      >
        <div className={isGlass ? "px-4 md:px-8" : undefined}>
          <div className="w-full max-w-[1080px] mx-auto">
            <div className="flex items-center gap-6 h-[70px]">
              {logo}
              {desktopNav}
              {mobileMenuButton}
            </div>
            {!isGlass && (
              <div className="h-px" style={{ background: "var(--color-border)" }} />
            )}
          </div>
        </div>
        {isGlass && (
          <div style={{ height: 1, background: "var(--color-border-faint)" }} />
        )}
      </div>
      {menuOpen && (
        <nav
          className={`sm:hidden flex flex-col ${isGlass ? "px-4 md:px-8" : ""}`}
          style={isGlass
            ? {
                background: "rgba(var(--header-glass-rgb), 0.69)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }
            : undefined}
        >
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
    </>
  );
}
