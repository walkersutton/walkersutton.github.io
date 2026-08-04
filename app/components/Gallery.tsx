import { Children, isValidElement, type ReactNode } from "react";
import GalleryLightbox, { type GalleryImage } from "./GalleryLightbox";

interface GalleryProps {
  children?: ReactNode;
  /** Columns on desktop. Defaults to the image count, capped at 3. */
  cols?: number | string;
  /** Thumbnail shape. Defaults to "auto": every image keeps its full height,
   *  nothing cropped. Pass a ratio ("4/3", "1/1", …) to crop to a uniform
   *  shape instead. */
  ratio?: string;
  /** Caption for the group as a whole, under the grid. */
  caption?: string;
}

/**
 * Images side by side in prose, each one clickable into a lightbox with its
 * caption and prev/next navigation. `pnpm img --gallery` emits this shape:
 *
 *   <Gallery>
 *     <Img src="…" alt="…" caption="morning at the pass" />
 *     <Img src="…" alt="…" />
 *   </Gallery>
 *
 * The list is read off the children's props rather than taken as a data prop
 * because next-mdx-remote strips JS expressions from MDX (`blockJS`), so
 * `images={[…]}` would never reach us. Children also keep the authoring syntax
 * the same as a standalone <Img>.
 */
export default function Gallery({
  children,
  cols,
  ratio = "auto",
  caption,
}: GalleryProps) {
  const images = collect(children);
  if (images.length === 0) return null;

  const requested = Number(cols);
  const columns = Number.isFinite(requested)
    ? Math.max(1, Math.min(requested, 4))
    : Math.min(images.length, 3);

  return (
    <GalleryLightbox
      images={images}
      cols={columns}
      ratio={ratio}
      caption={caption}
    />
  );
}

/** Pull {src, alt, caption} off every <Img>-shaped descendant, in order. */
function collect(children: ReactNode, depth = 0): GalleryImage[] {
  if (depth > 3) return [];
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const props = child.props as Partial<GalleryImage> & {
      children?: ReactNode;
    };
    if (typeof props.src === "string") {
      return [{ src: props.src, alt: props.alt, caption: props.caption }];
    }
    // MDX sometimes wraps a run of inline elements in a paragraph.
    return props.children ? collect(props.children, depth + 1) : [];
  });
}
