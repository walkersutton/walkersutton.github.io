import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import ContentPageLayout from "@/app/components/ContentPageLayout";
import ProjectImage from "@/app/components/ProjectImage";

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
  return { title: `${project.metadata.name} | Walker Sutton` };
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

  const header = (
    <>
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

      <div
        className="flex flex-wrap gap-x-6 gap-y-2 mt-8 pt-6 text-[13px]"
        style={{
          borderTop: "1px solid var(--color-rule)",
          color: "var(--color-text-faint)",
        }}
      >
        {metadata.date && (
          <span>
            <span className="font-semibold uppercase tracking-[0.1em] text-[10px] mr-2">
              Year
            </span>
            {metadata.date.slice(0, 4)}
          </span>
        )}
        {metadata.href && metadata.href !== "#" && (
          <MetaLink href={metadata.href} label="Live site" />
        )}
        {metadata.githubUrl && (
          <MetaLink href={metadata.githubUrl} label="GitHub" />
        )}
        {metadata.tiktokUrl && (
          <MetaLink href={metadata.tiktokUrl} label="TikTok" />
        )}
      </div>

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
