"use client";

import { useState } from "react";

/**
 * A preview image that degrades to the source's initial. Instagram's image
 * links are signed and expire, so a cached post can outlive its thumbnail.
 */
export default function Thumb({ src, label }: { src?: string; label: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="adm-media-fallback">{label.charAt(0)}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- remote, unoptimised, tiny
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}
