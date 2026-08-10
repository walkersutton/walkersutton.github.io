"use client";

import { upload } from "@vercel/blob/client";

// Photos used to go to Blob exactly as the phone produced them: 3-5MB a piece,
// several thousand pixels wide. Every visitor to the trip report then pulled
// the full original down to render it ~700px wide, and /admin/report pulled all
// of them down again to draw 72px thumbnails. That is what burned through most
// of the Blob data transfer allowance. Re-encode in the browser first — a
// 1600px WebP is a tenth the bytes and indistinguishable at the size it is
// displayed at.
const MAX_EDGE = 1600;
const QUALITY = 0.82;
// Below this a photo is already cheap to serve, and a second lossy pass would
// cost more quality than it saves bytes.
const SKIP_BYTES = 400 * 1024;

export const REPORT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$|\.heif$/i.test(file.name)
  );
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Decode, downscale to MAX_EDGE, and re-encode. Also the HEIC escape hatch:
 * Blob serves files as-is and only Safari can decode HEIC, so anything that
 * slips past the accept list (e.g. picked from the Files app) comes out of here
 * as something every browser can render.
 */
async function reencode(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    // Browsers apply EXIF orientation when rendering an <img>, so the canvas
    // gets the photo the right way up without reading the tag ourselves.
    await img.decode();

    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Safari only learned to encode WebP from a canvas in 16, and toBlob
    // silently hands back a PNG when it can't honour the type asked for — which
    // would be bigger than the original we're trying to shrink. Check what came
    // back rather than trusting it.
    let blob = await toBlob(canvas, "image/webp");
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
    if (!blob) throw new Error("encode failed");

    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ext, { type: blob.type });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepare(file: File): Promise<File> {
  // A canvas round trip keeps the first frame and throws the animation away.
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) return file;

  const heic = isHeic(file);
  if (!heic && file.size <= SKIP_BYTES) return file;

  let shrunk: File;
  try {
    shrunk = await reencode(file);
  } catch {
    // HEIC has no fallback: uploading it would publish an image most visitors
    // can't see, so fail loudly instead.
    if (heic) {
      throw new Error(
        `${file.name} is HEIC and this browser can't convert it — export it as JPEG first.`,
      );
    }
    // Everything else is only expensive, not broken. A photo that won't decode
    // here is still worth posting from the trail.
    console.warn(`could not re-encode ${file.name}, uploading the original`);
    return file;
  }

  // Already-optimised sources (a small WebP, a screenshot) can come out larger.
  if (!heic && shrunk.size >= file.size) return file;
  return shrunk;
}

export async function uploadReportImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const raw of files) {
    const file = await prepare(raw);
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/admin/report-upload",
    });
    urls.push(blob.url);
  }
  return urls;
}
