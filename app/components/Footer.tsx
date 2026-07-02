"use client";

import React from "react";
import NewsletterForm from "./NewsletterForm";
import chronicallyOnline from "@/data/chronicallyOnline.json";

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14c.5-1.88.5-5.8.5-5.8s0-3.92-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z" />
    </svg>
  );
}

// Maps a social's name (as it appears in chronicallyOnline.json) to its icon.
// Only names present here can render; the JSON's `footer: true` flag controls
// which of those are actually shown.
const ICONS: Record<string, () => React.ReactElement> = {
  Instagram: InstagramIcon,
  X: XIcon,
  YouTube: YouTubeIcon,
};

const SOCIAL = (
  chronicallyOnline as { name: string; href: string; footer?: boolean }[]
)
  .filter((s) => s.footer && ICONS[s.name])
  .map((s) => ({ label: s.name, href: s.href, icon: ICONS[s.name] }));

function SocialLink({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: () => React.ReactElement;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="no-underline flex items-center transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-90 motion-reduce:transition-none"
    >
      <Icon />
    </a>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full max-w-[1080px] mx-auto flex flex-col gap-5 pt-6 pb-8"
      style={{ borderTop: "1px solid var(--color-rule)" }}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <NewsletterForm />
        <div className="flex gap-4">
          {SOCIAL.map(({ label, href, icon }) => (
            <SocialLink key={label} label={label} href={href} icon={icon} />
          ))}
        </div>
      </div>
    </footer>
  );
}
