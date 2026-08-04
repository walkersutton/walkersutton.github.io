"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  /** Columns on desktop. */
  cols: number;
  /** Thumbnail crop, e.g. "4/3", "1/1", "3/2", or "auto" for no cropping. */
  ratio: string;
  /** Caption for the group, rendered under the grid. */
  caption?: string;
}

/**
 * The interactive half of <Gallery>: the thumbnail grid plus the lightbox it
 * opens. Gallery (a server component) reads the image list off its MDX
 * children and hands it here already flattened.
 */
export default function GalleryLightbox({
  images,
  cols,
  ratio,
  caption,
}: GalleryLightboxProps) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const count = images.length;
  const columns = cols;
  const auto = ratio === "auto";

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? i : (i + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const active = open === null ? null : images[open];

  return (
    <>
      <figure className="gallery my-10 [&_img]:my-0">
        <div
          className="gallery-grid"
          style={
            {
              "--cols": columns,
              "--cols-sm": Math.min(columns, 2),
            } as React.CSSProperties
          }
        >
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              className="gallery-thumb"
              onClick={() => setOpen(i)}
              aria-label={
                img.caption || img.alt || `Open image ${i + 1} of ${count}`
              }
              style={auto ? undefined : { aspectRatio: ratio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt ?? ""}
                loading="lazy"
                decoding="async"
                style={
                  auto
                    ? { width: "100%", height: "auto", display: "block" }
                    : {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }
                }
              />
            </button>
          ))}
        </div>
        {caption && <figcaption className="gallery-caption">{caption}</figcaption>}
      </figure>

      {active && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={close}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start === null || end === undefined) return;
            if (Math.abs(end - start) > 50) step(end < start ? 1 : -1);
          }}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>

          {count > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
            >
              ←
            </button>
          )}

          <figure
            className="lightbox-figure"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.src}
              alt={active.alt ?? ""}
              className="lightbox-img"
            />
            <figcaption className="lightbox-caption">
              {active.caption && <span>{active.caption}</span>}
              {count > 1 && (
                <span className="lightbox-count">
                  {(open ?? 0) + 1} / {count}
                </span>
              )}
            </figcaption>
          </figure>

          {count > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
            >
              →
            </button>
          )}

          {/* Keep the neighbours warm so paging doesn't flash. */}
          {count > 1 && (
            <div hidden>
              {[-1, 1].map((d) => {
                const n = images[((open ?? 0) + d + count) % count];
                // eslint-disable-next-line @next/next/no-img-element
                return <img key={d} src={n.src} alt="" />;
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
