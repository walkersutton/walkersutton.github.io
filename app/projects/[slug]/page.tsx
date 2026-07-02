import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import ContentPageLayout from "@/app/components/ContentPageLayout";

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
        {metadata.year && (
          <span>
            <span className="font-semibold uppercase tracking-[0.1em] text-[10px] mr-2">
              Year
            </span>
            {metadata.year}
          </span>
        )}
        {metadata.href && metadata.href !== "#" && (
          <a
            href={metadata.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-text)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Live site ↗
          </a>
        )}
        {metadata.githubUrl && (
          <a
            href={metadata.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-text)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            GitHub ↗
          </a>
        )}
      </div>

      {metadata.image && (
        <div style={{ marginTop: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.still ?? metadata.image}
            alt={metadata.name}
            style={{ width: "100%", height: "auto", display: "block" }}
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
