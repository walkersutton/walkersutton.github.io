"use client";

import { usePathname } from "next/navigation";

/**
 * Hides global site chrome on routes that don't want it: the trips routes
 * render their own full-bleed glass header over the map, and /links is a
 * standalone link page with no header or footer at all. The banner is left to
 * the layout so it stays a single persistent instance across navigation.
 */
export default function HideOnPaths({
  children,
  paths,
}: {
  children: React.ReactNode;
  /** Route prefixes to hide on, e.g. ["/trips"]. */
  paths: string[];
}) {
  const pathname = usePathname();
  if (paths.some((path) => pathname?.startsWith(path))) return null;
  return <>{children}</>;
}
