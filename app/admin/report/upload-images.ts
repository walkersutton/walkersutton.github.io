"use client";

import { upload } from "@vercel/blob/client";

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$|\.heif$/i.test(file.name)
  );
}

// Blob serves files as-is and only Safari can decode HEIC, so anything that
// slips past the accept list (e.g. picked from the Files app) gets re-encoded
// to JPEG here. Safari decodes HEIC natively; other browsers can't, so we fail
// loudly rather than publish an image most visitors can't see.
async function convertHeicToJpeg(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) throw new Error("encode failed");
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    throw new Error(
      `${file.name} is HEIC and this browser can't convert it — export it as JPEG first.`,
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const REPORT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export async function uploadReportImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const raw of files) {
    const file = isHeic(raw) ? await convertHeicToJpeg(raw) : raw;
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/admin/report-upload",
    });
    urls.push(blob.url);
  }
  return urls;
}
