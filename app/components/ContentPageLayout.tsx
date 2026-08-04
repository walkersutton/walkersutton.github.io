import { MDXRemote } from "next-mdx-remote/rsc";
import Gallery from "./Gallery";
import ProseImage from "./ProseImage";

interface ContentPageLayoutProps {
  title: string;
  children?: React.ReactNode;
  content: string;
}

export default function ContentPageLayout({
  title,
  children,
  content,
}: ContentPageLayoutProps) {
  const hasContent = content.trim().length > 0;

  return (
    <main>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "44px 28px 96px" }}>
        <h1
          className="font-semibold leading-[1.08] tracking-[-0.025em]"
          style={
            {
              fontSize: "clamp(28px,4vw,42px)",
              color: "var(--color-text)",
              marginBottom: 14,
              textWrap: "balance",
            } as React.CSSProperties
          }
        >
          {title}
        </h1>

        {children}

        {hasContent && (
          <div
            className="prose max-w-none
              prose-h2:text-[13px] prose-h2:font-semibold prose-h2:uppercase prose-h2:tracking-[0.1em] prose-h2:mt-10 prose-h2:mb-3
              prose-h3:text-[23px] prose-h3:font-semibold prose-h3:tracking-[-0.02em] prose-h3:leading-[1.2] prose-h3:mt-10 prose-h3:mb-3
              prose-p:leading-[1.65] prose-p:mt-0 prose-p:mb-5
              prose-ul:mt-2 prose-ol:mt-2
              prose-li:my-1
              prose-strong:font-semibold
              prose-a:no-underline prose-a:underline prose-a:underline-offset-[2px]
              prose-img:w-full prose-img:my-10
              prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:not-italic"
            style={
              {
                marginTop: 28,
                color: "var(--color-text)",
                fontSize: 16,
                lineHeight: 1.65,
                "--tw-prose-body": "var(--color-text)",
                "--tw-prose-headings": "var(--color-text)",
                "--tw-prose-links": "var(--color-text-variant)",
                "--tw-prose-bold": "var(--color-text)",
                "--tw-prose-quotes": "var(--color-text-variant)",
                "--tw-prose-quote-borders": "var(--color-border)",
                "--tw-prose-captions": "var(--color-text-faint)",
                "--tw-prose-code": "var(--color-text)",
                "--tw-prose-pre-bg": "var(--color-bg-sink)",
                "--tw-prose-counters": "var(--color-text-faint)",
                "--tw-prose-bullets": "var(--color-text-faint)",
                "--tw-prose-hr": "var(--color-border)",
                "--tw-prose-th-borders": "var(--color-border)",
                "--tw-prose-td-borders": "var(--color-border-faint)",
              } as React.CSSProperties
            }
          >
            <MDXRemote
              source={content}
              components={{ Img: ProseImage, img: ProseImage, Gallery }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
