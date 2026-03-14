"use client";

import { useEffect, useRef, useState } from "react";

interface ProjectImageProps {
  src: string;
  alt: string;
}

export default function ProjectImage({ src, alt }: ProjectImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(null);
  const isGif = src.toLowerCase().endsWith(".gif");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isGif) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        setStaticFrame(canvas.toDataURL("image/webp"));
      } catch (err) {
        console.error("Failed to capture GIF frame:", err);
        // Fallback to the GIF if canvas capture fails (e.g. CORS)
        setStaticFrame(src);
      }
    };
  }, [src, isGif]);

  const [nonce, setNonce] = useState(0);

  if (!isGif) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
      />
    );
  }

  // Add a nonce to the GIF URL to force restart on hover
  const gifSrc = isHovered ? `${src}?v=${nonce}` : src;

  return (
    <div 
      className="relative w-full h-auto overflow-hidden bg-neutral-100 dark:bg-neutral-800"
      onMouseEnter={() => {
        setNonce(n => n + 1);
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Base Image (Static Frame) - Defines the container size */}
      {/* We use a hidden version of the original src to ensure the container gets height immediately */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="w-full h-auto block opacity-0 pointer-events-none"
      />

      {/* Visible Static Frame */}
      {staticFrame && (
        <img
          src={staticFrame}
          alt={alt}
          className="absolute inset-0 w-full h-full block transition-opacity duration-300 opacity-100"
        />
      )}

      {/* Animated Overlay */}
      {staticFrame && (
        <img
          src={gifSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full block transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
