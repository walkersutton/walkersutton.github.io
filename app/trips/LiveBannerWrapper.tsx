"use client";

import { usePathname } from "next/navigation";
import LiveBanner from "./LiveBanner";

export default function LiveBannerWrapper() {
  const pathname = usePathname();
  // Trips routes render their own banner inside their scroll container so it
  // scrolls away with the content instead of staying pinned to the viewport.
  if (pathname?.startsWith("/trips")) return null;
  return <LiveBanner />;
}
