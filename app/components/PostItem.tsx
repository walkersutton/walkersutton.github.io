import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

export interface PostItemProps {
  date?: string;
  title: string;
  href: string;
  excerpt?: string;
  isExternal?: boolean;
}

export default function PostItem({
  date,
  title,
  href,
  excerpt,
  isExternal,
}: PostItemProps) {
  return (
    <div className="group flex flex-col gap-1 py-0 first:pt-0">
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="inline-flex items-center gap-2 w-fit"
      >
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight hover:underline decoration-[var(--accent)] underline-offset-4">
          {title}
        </h3>
        {isExternal && <span className="text-sm opacity-50 font-bold">↗</span>}
      </Link>
      {date && (
        <h4 className="text-sm text-[var(--color-text-variant)] font-medium">
          {new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h4>
      )}
      {excerpt && (
        <div
          className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-[var(--color-text-variant)]
          prose-h2:text-lg prose-h3:text-base prose-h4:text-sm
          prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
          prose-headings:text-[var(--color-text-variant)]
          prose-strong:text-[var(--color-text-variant)]
          prose-li:marker:text-[var(--color-text-variant)]
          prose-p:my-2 prose-p:leading-relaxed prose-li:my-0.5"
        >
          <MDXRemote
            source={excerpt}
            components={{ a: ({ children }) => <span>{children}</span> }}
          />
        </div>
      )}
    </div>
  );
}
