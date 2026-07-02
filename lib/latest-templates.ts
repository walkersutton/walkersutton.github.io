export type LatestTemplateKey =
  | "youtubeShort"
  | "youtubeVideo"
  | "instagramPost"
  | "instagramReel"
  | "blueskyPost"
  | "tripReport"
  | "project"
  | "post";

export type LatestTemplate = { prefix: string; content: string; suffix: string };

export type LatestTemplates = Record<LatestTemplateKey, LatestTemplate>;

export const LATEST_TEMPLATE_LABELS: Record<LatestTemplateKey, string> = {
  youtubeShort: "YouTube short",
  youtubeVideo: "YouTube video",
  instagramPost: "Instagram post",
  instagramReel: "Instagram reel",
  blueskyPost: "Bluesky post",
  tripReport: "Trip report",
  project: "Project",
  post: "Post",
};

// Templates whose `content` is a dynamic item title rather than fixed text —
// {title} in `content` gets swapped for the actual name at render time.
export const LATEST_TEMPLATE_HAS_TITLE: Record<LatestTemplateKey, boolean> = {
  youtubeShort: false,
  youtubeVideo: false,
  instagramPost: false,
  instagramReel: false,
  blueskyPost: false,
  tripReport: true,
  project: true,
  post: true,
};

export const DEFAULT_LATEST_TEMPLATES: LatestTemplates = {
  youtubeShort: { prefix: "new ", content: "youtube short", suffix: "" },
  youtubeVideo: { prefix: "new ", content: "youtube vid", suffix: "" },
  instagramPost: { prefix: "new ", content: "insta post", suffix: "" },
  instagramReel: { prefix: "new ", content: "reel", suffix: "" },
  blueskyPost: { prefix: "new ", content: "bluesky post", suffix: "" },
  tripReport: { prefix: "new trip report: ", content: "{title}", suffix: "" },
  project: { prefix: "new project: ", content: "{title}", suffix: "" },
  post: { prefix: "new post: ", content: "{title}", suffix: "" },
};

export function renderLatestTemplate(template: LatestTemplate, title?: string): string {
  const content = title !== undefined ? template.content.replaceAll("{title}", title) : template.content;
  return `${template.prefix}${content}${template.suffix}`;
}
