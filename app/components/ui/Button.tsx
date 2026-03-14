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
  const baseStyles = `relative overflow-x-hidden ${fullWidth ? "w-full" : ""} py-4 px-8 text-sm font-semibold tracking-widest uppercase enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center origin-center transition-all duration-200 enabled:active:scale-[0.98]`;

  const variants = {
    primary: "bg-[var(--color-text)] border-[var(--color-text)] border text-[var(--color-bg)] hover:bg-transparent hover:text-[var(--color-text)]",
    secondary: "bg-transparent border border-[var(--color-text)] text-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]",
  };

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
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${variants[variant]} ${className}`}>
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
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {content}
    </button>
  );
}
