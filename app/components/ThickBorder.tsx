import React from "react";

interface ThickBorderProps {
  className?: string;
  as?: "hr" | "div";
}

export default function ThickBorder({
  className = "",
  as: Component = "hr",
}: ThickBorderProps) {
  return (
    <Component
      className={`w-full border-0 ${className}`}
      style={{ borderTop: "1px solid var(--color-rule)" }}
    />
  );
}
