import { getAllPosts } from "./posts";
import { getAllProjects } from "./projects";
import { buildTripEntries } from "./trips";
import { getSocialLatest, getLatestTemplates } from "./live-state";
import { renderLatestTemplate, type LatestTemplates } from "./latest-templates";

export type LatestFallback = { text: string; href: string; publishedAt: string };

export function getLatestPostCandidate(templates: LatestTemplates): LatestFallback | null {
  const latest = getAllPosts()[0];
  if (!latest?.date) return null;

  return {
    text: renderLatestTemplate(templates.post, latest.title),
    href: latest.external_url ?? `/posts/${latest.slug}`,
    publishedAt: latest.date,
  };
}

export function getLatestProjectCandidate(templates: LatestTemplates): LatestFallback | null {
  const dated = getAllProjects().filter((p) => !p.hide && p.date);
  if (!dated.length) return null;

  const latest = dated.sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!))[0];
  return {
    text: renderLatestTemplate(templates.project, latest.name),
    href: `/projects/${latest.slug}`,
    publishedAt: latest.date!,
  };
}

export function getLatestTripCandidate(templates: LatestTemplates): LatestFallback | null {
  const latest = buildTripEntries()[0];
  if (!latest?.date) return null;

  return {
    text: renderLatestTemplate(templates.tripReport, latest.name),
    href: latest.href,
    publishedAt: latest.date,
  };
}

// Picks whichever is most recently published across every source that can
// feed the homepage "the latest:" link — a social post, a writing post, or a
// project — so publishing any one of them can surface there, not just social.
export async function getLatestFallback(): Promise<LatestFallback | null> {
  const templates = await getLatestTemplates();
  const candidates = [
    await getSocialLatest(),
    getLatestPostCandidate(templates),
    getLatestProjectCandidate(templates),
  ].filter((c): c is LatestFallback => c !== null);

  if (!candidates.length) return null;

  return candidates.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )[0];
}
