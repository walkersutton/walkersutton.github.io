"use client";

import { useEffect } from "react";
import { settleOnHash } from "./day-scroll";

/**
 * Makes a shared `/trips/<slug>#day-21` land on day 21.
 *
 * Renders nothing. It exists because the map's click handler puts that hash in
 * the URL, so those links get shared — and on a fresh load the browser's own
 * anchor scroll happens before any photo below the fold has loaded, landing
 * short for exactly the reason day-scroll.ts describes.
 *
 * Separate from the map rather than folded into it: a trip whose geojson has no
 * start point renders no map at all (see page.tsx), and its day anchors should
 * still work.
 */
export default function DayHashScroll() {
  useEffect(() => {
    settleOnHash();
  }, []);
  return null;
}
