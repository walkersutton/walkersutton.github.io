import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import ThickBorder from "./ThickBorder";

const FOOTER_LINKS = {
  main: [
    {
      label: "Instagram",
      href: "https://instagram.com/bandiitb0y",
      isExternal: true,
    },
    { label: "X", href: "https://x.com/walkercsutton", isExternal: true },
    { label: "Contact", href: "mailto:walker@walkersutton.com" },
    // {
    //   label: "TikTok",
    //   href: "https://www.tiktok.com/@bandiitb0y",
    //   isExternal: true,
    // },
  ],
};

const FOOTER_LINK_CLASS = "nav-link hover-accent text-sm";

export default function Footer() {
  return (
    <footer className="w-full mt-8 border-t-5 border-neutral-800 dark:border-neutral-200 flex flex-col md:flex-row items-stretch bg-[var(--color-bg)] md:px-0">
      <div className="flex-1 flex flex-col md:flex-row items-stretch">
        <div className="flex-1 flex items-center py-4">
          <NewsletterForm />
        </div>
        
        {/* Mobile Separator */}
        <div className="md:hidden">
          <ThickBorder />
        </div>
      </div>

      <nav className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-end gap-x-12 md:gap-x-6 gap-y-8 py-4">
        {FOOTER_LINKS.main.map((link) =>
          link.isExternal ? (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${FOOTER_LINK_CLASS}`}
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              className={`${FOOTER_LINK_CLASS}`}
            >
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </footer>
  );
}
