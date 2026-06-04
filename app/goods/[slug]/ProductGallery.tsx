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
      <div className="pd-gallery">
        {images.map((img, i) => (
          <div
            key={i}
            className="shop-img cursor-zoom-in"
            style={{
              aspectRatio: i === 0 ? "4/5" : "1/1",
              borderRadius: 8,
              position: "relative",
            }}
            onClick={() => setZoomedImage(img)}
          >
            <Image
              src={img}
              alt={`${name} ${i + 1}`}
              fill
              className="object-cover"
              style={{ borderRadius: 8 }}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 cursor-zoom-out"
          style={{ background: "rgba(19,16,9,0.88)" }}
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
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
