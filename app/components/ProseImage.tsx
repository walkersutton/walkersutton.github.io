import ProjectImage from "./ProjectImage";

interface ProseImageProps {
  src: string;
  alt?: string;
  /** Poster frame for gifs/videos — see ProjectImage. */
  still?: string;
  /** Constrain to viewport height instead of column width (portrait shots). */
  tall?: boolean;
  caption?: string;
}

/**
 * Images inside post/project prose. Animated media delegates to ProjectImage
 * (hover-to-play); stills render as a plain lazy <img> so static posts ship no
 * client JS. Also mapped onto markdown's `![]()` in ContentPageLayout.
 */
export default function ProseImage({
  src,
  alt = "",
  still,
  tall,
  caption,
}: ProseImageProps) {
  const isAnimated = /\.(gif|mp4|webm)$/i.test(src);

  // ProjectImage sizes itself to the column, so `tall` has to be applied by a
  // wrapper that re-constrains its internal sizer image. The wrapper also
  // neutralizes the prose's prose-img:my-10, which would otherwise land on
  // ProjectImage's internal sizer/overlay imgs and inflate its container
  // (gray letterbox bands + cropping); vertical rhythm moves to the wrapper.
  const media = isAnimated ? (
    <div
      className={[
        caption ? "" : "my-10",
        "[&_img]:my-0",
        tall ? "mx-auto [&_img]:max-h-[70vh] [&_img]:w-auto [&_video]:max-h-[70vh]" : "",
      ]
        .join(" ")
        .trim()}
      style={tall ? { width: "fit-content" } : undefined}
    >
      <ProjectImage src={src} still={still} alt={alt} />
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={tall ? "img-tall" : "img-wide"}
      loading="lazy"
      decoding="async"
    />
  );

  if (!caption) return media;

  return (
    // Neutralize prose-img:my-10 so the caption stays attached to the image.
    <figure className="my-10 [&_img]:my-0">
      {media}
      <figcaption
        style={{
          marginTop: 10,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-text-faint)",
          textAlign: "center",
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
