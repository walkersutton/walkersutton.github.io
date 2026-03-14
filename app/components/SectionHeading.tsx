import React from "react";
import Link from "next/link";

import ThickBorder from "./ThickBorder";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export default function SectionHeading({
  children,
  className = "",
  href,
}: SectionHeadingProps) {
  const heading = (
    <h2
      className={`text-2xl font-display font-bold inline-block ${href ? "hover-accent" : ""} ${className}`}
    >
      {children}
    </h2>
  );

  return (
    <div className="mb-4">
      {href ? <Link href={href}>{heading}</Link> : heading}
      <ThickBorder className="mt-1" />
    </div>
  );
}