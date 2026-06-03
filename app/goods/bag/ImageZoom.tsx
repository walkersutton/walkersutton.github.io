"use client";

import Image from "next/image";

interface ImageZoomProps {
  src: string;
  onClose: () => void;
}

export default function ImageZoom({ src, onClose }: ImageZoomProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 flex items-center justify-center p-6 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
        <Image src={src} alt="Zoomed product" fill className="object-contain" />
      </div>
    </div>
  );
}
