"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/config";

const SECTIONS = [
  { prefix: "/projects", label: "Projects", root: "/projects" },
  { prefix: "/store", label: "Store", root: "/store" },
  { prefix: "/blog", label: "Blog", root: "/blog" },
];

export default function HeaderTitle() {
  const pathname = usePathname();
  const activeSection = SECTIONS.find((s) => pathname.startsWith(s.prefix));

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0">
      <Link href="/">
        <h1 className={`font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight ${activeSection ? 'hover-accent' : ''}`}>
          {SITE_CONFIG.title}
        </h1>
      </Link>
      {activeSection && (
        <Link href={activeSection.root}>
          <span className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--accent)] hover-accent">
            {activeSection.label}
          </span>
        </Link>
      )}
    </div>
  );
}
