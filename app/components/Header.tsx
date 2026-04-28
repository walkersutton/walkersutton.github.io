"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderTitle from "./HeaderTitle";
import CartSummary from "./CartSummary";
import HamburgerButton from "./HamburgerButton";
import ThickBorder from "./ThickBorder";

const HEADER_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isStore = pathname?.startsWith("/store");

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }
    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMenuOpen]);

  return (
    <header className="pt-4 pb-4 flex flex-col">
      <div className="flex items-center gap-4 pb-1 md:pl-0 md:pr-0 lg:pr-0">
        <HeaderTitle />

        {isStore ? (
          <div className="ml-auto">
            <CartSummary />
          </div>
        ) : (
          <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-row gap-5 ml-auto items-center">
              {HEADER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link hover-accent text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden ml-auto flex items-center">
              <HamburgerButton
                isOpen={isMenuOpen}
                onToggle={() => setIsMenuOpen(!isMenuOpen)}
              />
            </div>
          </>
        )}
      </div>

      <ThickBorder />

      {/* Mobile Navigation Drawer (non-store only) */}
      {!isStore && (
        <div className="md:hidden">
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <nav className="flex flex-col gap-4 pt-6 pb-6">
              {HEADER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="nav-link hover-accent text-lg w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {isMenuOpen && <ThickBorder />}
          </div>
        </div>
      )}
    </header>
  );
}
