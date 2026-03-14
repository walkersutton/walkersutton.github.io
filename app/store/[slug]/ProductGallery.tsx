"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col">
        {images.map((img, index) => (
          <div
            key={index}
            className="aspect-square relative w-full cursor-zoom-in"
            onClick={() => setZoomedImage(img)}
          >
            <Image
              src={img}
              alt={`${name} image ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Zoom Overlay */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-white/95 dark:bg-black/95 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
            <Image
              src={zoomedImage}
              alt="Zoomed product"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
