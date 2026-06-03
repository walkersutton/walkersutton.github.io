import NewsletterForm from "./NewsletterForm";
const SOCIAL = [
  {
    label: "Instagram",
    href: "https://instagram.com/bandiitb0y",
    external: true,
  },
  { label: "X", href: "https://x.com/walkercsutton", external: true },
  { label: "GitHub", href: "https://github.com/walkersutton", external: true },
  { label: "Email", href: "mailto:walker@walkersutton.com", external: false },
];

export default function Footer() {
  return (
    <footer
      className="w-full max-w-[1080px] mx-auto mt-16 py-8 grid grid-cols-[minmax(260px,420px)_1fr] items-end gap-x-10 gap-y-6 max-[720px]:grid-cols-1"
      style={{ borderTop: "1px solid var(--color-border-faint)" }}
    >
      <NewsletterForm />

      <div className="flex flex-wrap items-center justify-end gap-6 max-[720px]:justify-start">
        {SOCIAL.map(({ label, href, external }) => (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="link-sweep text-[13px] no-underline"
            style={{ color: "var(--color-text-faint)" }}
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
