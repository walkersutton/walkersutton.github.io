import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import ContentPageLayout from "@/app/components/ContentPageLayout";
import ProjectImage from "@/app/components/ProjectImage";
import { pageAlternates } from "@/lib/config";

function fmtMonthYear(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

function MetaLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "var(--color-text)", textDecoration: "none" }}
    >
      <span className="underline-border">
        <span className="b b-bottom" />
        <span className="b b-right" />
        <span className="b b-top" />
        <span className="b b-left" />
        {label} ↗
      </span>
    </a>
  );
}

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.metadata.name} | Walker Sutton`,
    alternates: pageAlternates(`/projects/${slug}`),
  };
}

export default async function ProjectPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { isEnabled: showDrafts } = await draftMode();
  if (project.metadata.draft && !showDrafts) notFound();

  const { metadata, content } = project;

  const links = [
    metadata.href && metadata.href !== "#" && { href: metadata.href, label: "Live site" },
    metadata.githubUrl && { href: metadata.githubUrl, label: "GitHub" },
    metadata.tiktokUrl && { href: metadata.tiktokUrl, label: "TikTok" },
  ].filter((link): link is { href: string; label: string } => !!link);

  const header = (
    <>
      {/* Directly under the title, like posts and trips. */}
      {metadata.date && (
        <div
          className="text-[14px] tabular-nums"
          style={{
            color: "var(--color-text-variant)",
            marginBottom: metadata.blurb ? 16 : 0,
          }}
        >
          <time dateTime={metadata.date}>{fmtMonthYear(metadata.date)}</time>
        </div>
      )}

      {metadata.blurb && (
        <p
          style={{
            fontSize: 18,
            color: "var(--color-text-variant)",
            lineHeight: 1.5,
            marginBottom: 0,
          }}
        >
          {metadata.blurb}
        </p>
      )}

      {links.length > 0 && (
        <div
          className="flex flex-wrap gap-x-6 gap-y-2 mt-8 pt-6 text-[13px]"
          style={{
            borderTop: "1px solid var(--color-rule)",
            color: "var(--color-text-faint)",
          }}
        >
          {links.map((link) => (
            <MetaLink key={link.label} href={link.href} label={link.label} />
          ))}
        </div>
      )}

      {metadata.image && (
        <div style={{ marginTop: 36 }}>
          <ProjectImage
            src={metadata.image}
            still={metadata.still}
            alt={metadata.name}
          />
        </div>
      )}
    </>
  );

  return (
    <ContentPageLayout title={metadata.name} content={content}>
      {header}
    </ContentPageLayout>
  );
}
