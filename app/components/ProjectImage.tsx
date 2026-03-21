"use client";

import { useEffect, useRef, useState } from "react";

interface ProjectImageProps {
  src: string;
  still?: string;
  alt: string;
}

export default function ProjectImage({ src, still, alt }: ProjectImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(still || null);
  const [isGifLoaded, setIsGifLoaded] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const isGif = src.toLowerCase().endsWith(".gif");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Detect touch/mobile — on these devices GIFs should loop natively
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  useEffect(() => {
    if (!isGif || isTouchDevice) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      setIsGifLoaded(true);
      
      // If we don't have a pre-generated still, extract one from the loaded GIF
      if (!still) {
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
          // Don't set staticFrame to src (the GIF) to avoid looping
        }
      }
    };
  }, [src, isGif, isTouchDevice, still]);

  const [nonce, setNonce] = useState(0);

  if (!isGif || isTouchDevice) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
        loading="lazy"
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
      
      {/* Base Image (Static Frame or Still) - Defines the container size */}
      <img
        src={still || src}
        alt=""
        aria-hidden="true"
        className="w-full h-auto block opacity-0 pointer-events-none"
      />

      {/* Visible Static Frame / Placeholder */}
      {staticFrame && (
        <img
          src={staticFrame}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover block transition-opacity duration-300 opacity-100"
        />
      )}

      {/* Animated Overlay - Only load if hovered or after some background loading logic if desired */}
      {/* For now, we always start loading the GIF in background via useEffect, but only show it here on hover */}
      <img
        src={gifSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover block transition-opacity duration-200 ${
          isHovered && isGifLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
