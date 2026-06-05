"use client";

import { usePathname } from "next/navigation";
import LiveBanner from "./LiveBanner";

export default function LiveBannerWrapper({ text }: { text: string }) {
  const pathname = usePathname();
  // The live page is itself the full-screen live map, so the banner is redundant
  // there. Everywhere else the banner is a single persistent instance rendered by
  // the root layout, so it never remounts (and the marquee never restarts) when
  // navigating between pages — including across the /trips boundary.
  if (pathname === "/trips/live") return null;
  return <LiveBanner text={text} />;
}
