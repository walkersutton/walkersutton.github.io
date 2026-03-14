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
      className={`border-t-5 border-neutral-800 dark:border-neutral-200 w-full ${className}`}
    />
  );
}
