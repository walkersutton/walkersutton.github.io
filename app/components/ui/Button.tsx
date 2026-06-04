"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  form?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export default function Button({
  children,
  onClick,
  href,
  type = "button",
  form,
  disabled = false,
  loading = false,
  className = "",
  variant = "primary",
  fullWidth = true,
}: ButtonProps) {
  const cls = variant === "primary" ? "btn-primary" : "btn-ghost";
  const style = fullWidth ? undefined : { width: "auto" };

  const content = (
    <div className="flex items-center justify-center relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={`${cls} ${className}`} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${cls} ${className}`}
      style={style}
    >
      {content}
    </button>
  );
}
