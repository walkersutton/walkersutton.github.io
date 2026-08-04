import type React from "react";
import Link from "next/link";
import { draftMode } from "next/headers";
import { getAllProjects } from "@/lib/projects";
import { getAllPosts, getPostBySlug, generateExcerpt } from "@/lib/posts";
import { buildTripEntries } from "@/lib/trips";
import { ProjectHomeGrid, type ProjectRowData } from "./components/ProjectRow";
import PostItem from "./components/PostItem";
import PageContainer from "./components/PageContainer";
import SectionBar from "./components/SectionBar";
import HomeTripsHero from "./components/HomeTripsHero";
import HomeTripSection from "./components/HomeTripSection";
import {
  getActiveTripName,
  getLatestOverride,
  getLiveEnabled,
} from "@/lib/live-state";
import { getLatestFallback } from "@/lib/latest";
import { getMapShareData } from "@/lib/mapshare-server";

export default async function Home() {
  const { isEnabled: includeDrafts } = await draftMode();
  const visible = getAllProjects({ includeDrafts }).sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
  ) as ProjectRowData[];
  const allTrips = buildTripEntries({ includeDrafts });
  const recentTrips = allTrips.slice(0, 3);

  const postsMetadata = getAllPosts({ includeDrafts }).slice(0, 4);
  const [posts, latestOverride, latestFallbackAuto, isLive, activeTripName] =
    await Promise.all([
      Promise.all(
        postsMetadata.map(async (meta) => {
          const full = await getPostBySlug(meta.slug);
          const excerpt = generateExcerpt(full?.content ?? "", { length: 140 });
          return { ...meta, excerpt };
        }),
      ),
      getLatestOverride(),
      getLatestFallback(),
      getLiveEnabled(),
      getActiveTripName(),
    ]);

  // Fetched server-side (only while live) so the hero map renders with the
  // real live position on first paint instead of flashing past trips while
  // the client polls /api/mapshare itself.
  const initialMapShare = isLive ? (await getMapShareData()).data : undefined;

  const latestPost = posts[0];
  const latestFallback = latestOverride ?? latestFallbackAuto;

  // Consumed by the "the latest:" hero chip, currently commented out below.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const latestText =
    latestFallback?.text ?? (latestPost ? latestPost.title : null);
  const latestHref =
    latestFallback?.href ??
    (latestPost
      ? (latestPost.external_url ?? `/posts/${latestPost.slug}`)
      : null);
  const isExternal = latestFallback
    ? !latestFallback.href.startsWith("/")
    : !!latestPost?.external_url;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <>
      {/* While live, the trips overview map leads the page with the current
          trip on it; the rest of the home page flows below. */}
      {isLive && (
        <HomeTripsHero
          trips={allTrips}
          activeTripName={activeTripName}
          initialMapShare={initialMapShare}
        />
      )}

      <PageContainer>
        {/* Hero */}
        <section className="pt-6 pb-4 max-w-[820px]">
          <div
            className="flex flex-wrap gap-4 text-[13px] font-medium mb-5"
            style={{ color: "var(--color-text)" }}
          >
            {/* {latestText && latestHref && (
              <span>
                the latest:&nbsp;&nbsp;
                <a
                  href={latestHref}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  style={{
                    color: "var(--color-text)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  <span className="underline-border">
                    <span className="b b-bottom" />
                    <span className="b b-right" />
                    <span className="b b-top" />
                    <span className="b b-left" />
                    {latestText} ↗
                  </span>{" "}
                </a>
              </span>
            )} */}
          </div>
          <h1
            className="text-[clamp(26px,4vw,44px)] font-bold leading-[1.18] tracking-[-0.025em] m-0"
            style={
              {
                color: "var(--color-text)",
                textWrap: "balance",
              } as React.CSSProperties
            }
          >
            The{" "}
            <Link
              href="/trips/live/report"
              style={{ color: "var(--color-text)", textDecoration: "none" }}
            >
              <span className="underline-border underline-border-thick">
                <span className="b b-bottom" />
                <span className="b b-right" />
                <span className="b b-top" />
                <span className="b b-left" />
                TRIP REPORT
              </span>
            </Link>
          </h1>
        </section>

        <SectionBar title="Projects" href="/projects" spacing="lg" />
        <ProjectHomeGrid projects={visible} maxProjects={4} />

        <SectionBar title="Posts" href="/posts" spacing="lg" />
        <div className="flex flex-col">
          {posts.map((post) => (
            <PostItem
              key={post.slug}
              date={post.date}
              title={post.title}
              href={post.external_url ?? `/posts/${post.slug}`}
              excerpt={post.excerpt}
              isExternal={!!post.external_url}
            />
          ))}
        </div>

        {/* While live, the hero map above already shows the live position —
            skip the static past-trips map so it isn't shown alongside it.
            Hidden entirely when there are no published trips. */}
        {!isLive && allTrips.length > 0 && (
          <>
            <SectionBar title="Trip Reports" href="/trips" spacing="lg" />
            <HomeTripSection trips={recentTrips} />
          </>
        )}
      </PageContainer>
    </>
  );
}
