import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "main" | "article" | "section" | "div";
}

export default function Container({
  children,
  className = "",
  as: Component = "main",
}: ContainerProps) {
  return (
    <Component
      className={`max-w-2xl mx-auto flex flex-col ${className}`}
    >
      {children}
    </Component>
  );
}
