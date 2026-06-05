"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the global site chrome (header / footer) on the trips routes, which
 * render their own full-bleed glass header over the map. The banner is left to
 * the layout so it stays a single persistent instance across navigation.
 */
export default function HideOnTrips({
  children,
  hideOnHome = false,
}: {
  children: React.ReactNode;
  hideOnHome?: boolean;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/trips")) return null;
  if (hideOnHome && pathname === "/") return null;
  return <>{children}</>;
}
