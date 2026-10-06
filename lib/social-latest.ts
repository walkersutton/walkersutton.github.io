import { renderLatestTemplate, type LatestTemplates } from "./latest-templates";

export type SocialPost = {
  platform: "YouTube" | "Instagram" | "Bluesky";
  account: string;
  text: string;
  href: string;
  publishedAt: string;
  // What the post actually is, for the admin preview. Optional because posts
  // cached before these were recorded don't have them until the next refresh.
  title?: string;
  description?: string;
  thumbnail?: string;
};

/** First line of a caption, trimmed to something that fits on one row. */
function firstLine(text: string | undefined, max = 120): string | undefined {
  const line = text?.split("\n").map((l) => l.trim()).find(Boolean);
  if (!line) return undefined;
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export type InstagramAccount = { userId: string; accessToken: string; username?: string };

export type SocialConfig = {
  youtubeChannelId: string | null;
  instagramAccounts: InstagramAccount[];
  blueskyHandle: string | null;
  templates: LatestTemplates;
};

function readTag(source: string, tag: string): string | undefined {
  const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim();
}

// YouTube's feeds/APIs don't expose a Shorts flag. /shorts/{id} stays a 200 for
// an actual Short and 303-redirects to /watch?v= for a regular video — the only
// free way to tell them apart.
async function isYouTubeShort(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      redirect: "manual",
      next: { revalidate: 0 },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

// YouTube's feed endpoint intermittently 404s for a channel that otherwise
// loads fine (confirmed by hammering it directly) — retry a couple times
// before giving up so one flaky response doesn't drop the platform entirely.
async function fetchYouTubeFeedXml(channelId: string, attempts = 3): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 0 } },
    );
    if (res.ok) return res.text();
    if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
  }
  return null;
}

async function fetchLatestYouTube(channelId: string | null, templates: LatestTemplates): Promise<SocialPost | null> {
  if (!channelId) return null;

  const xml = await fetchYouTubeFeedXml(channelId);
  if (!xml) return null;

  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) return null;

  const videoId = readTag(entry, "yt:videoId");
  const published = readTag(entry, "published");
  if (!videoId || !published) return null;

  const isShort = await isYouTubeShort(videoId);

  return {
    platform: "YouTube",
    account: channelId,
    text: renderLatestTemplate(isShort ? templates.youtubeShort : templates.youtubeVideo),
    href: `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: published,
    title: decodeEntities(readTag(entry, "title") ?? "") || undefined,
    description: firstLine(decodeEntities(readTag(entry, "media:description") ?? "")),
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

async function fetchLatestInstagram(account: InstagramAccount, templates: LatestTemplates): Promise<SocialPost | null> {
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${account.userId}/media?fields=permalink,media_product_type,media_type,media_url,thumbnail_url,caption,timestamp&limit=1&access_token=${account.accessToken}`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) return null;

  const json = await res.json();
  const post = json?.data?.[0];
  if (!post?.permalink || !post?.timestamp) return null;

  return {
    platform: "Instagram",
    account: account.username ?? account.userId,
    text: renderLatestTemplate(post.media_product_type === "REELS" ? templates.instagramReel : templates.instagramPost),
    href: post.permalink,
    publishedAt: post.timestamp,
    // A video's media_url is the video itself; its still is thumbnail_url.
    // Both are signed CDN links that expire, which is fine for something
    // refreshed daily.
    title: firstLine(post.caption),
    thumbnail: post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url,
  };
}

type BlueskyEmbed = {
  images?: { thumb?: string }[];
  external?: { thumb?: string };
  thumbnail?: string;
  media?: BlueskyEmbed;
};

// Images, a link card, a video, or any of those quoted alongside a record.
function blueskyThumbnail(embed: BlueskyEmbed | undefined): string | undefined {
  if (!embed) return undefined;
  return embed.images?.[0]?.thumb ?? embed.external?.thumb ?? embed.thumbnail ?? blueskyThumbnail(embed.media);
}

async function fetchLatestBluesky(handle: string | null, templates: LatestTemplates): Promise<SocialPost | null> {
  if (!handle) return null;

  const res = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=10&filter=posts_no_replies`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) return null;

  const json = await res.json();
  const items: {
    post: { uri: string; record?: { createdAt?: string; text?: string }; indexedAt: string; embed?: BlueskyEmbed };
    reason?: unknown;
  }[] = json?.feed ?? [];

  const original = items.find((item) => !item.reason);
  if (!original) return null;

  const rkey = original.post.uri.split("/").pop();
  if (!rkey) return null;

  const publishedAt = original.post.record?.createdAt ?? original.post.indexedAt;

  return {
    platform: "Bluesky",
    account: handle,
    text: renderLatestTemplate(templates.blueskyPost),
    href: `https://bsky.app/profile/${handle}/post/${rkey}`,
    publishedAt,
    title: firstLine(original.post.record?.text),
    thumbnail: blueskyThumbnail(original.post.embed),
  };
}

// Returns the latest post from every configured account (one YouTube channel,
// one Bluesky handle, each Instagram account), newest first — not just the
// single most recent across all of them, so slower-posting accounts aren't
// permanently shadowed by a high-frequency one.
export async function getAllLatestSocialPosts(config: SocialConfig): Promise<SocialPost[]> {
  const results = await Promise.allSettled([
    fetchLatestYouTube(config.youtubeChannelId, config.templates),
    fetchLatestBluesky(config.blueskyHandle, config.templates),
    ...config.instagramAccounts.map((account) => fetchLatestInstagram(account, config.templates)),
  ]);

  const posts = results
    .filter((r): r is PromiseFulfilledResult<SocialPost | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((post): post is SocialPost => post !== null);

  return posts.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function getMostRecentSocialPost(config: SocialConfig): Promise<SocialPost | null> {
  const posts = await getAllLatestSocialPosts(config);
  return posts[0] ?? null;
}

export async function refreshSocialLatest(): Promise<SocialPost[]> {
  const {
    setSocialLatestPosts,
    getYouTubeChannelId,
    getInstagramAccounts,
    getBlueskyHandle,
    getLatestTemplates,
  } = await import("./live-state");

  const [youtubeChannelId, instagramAccounts, blueskyHandle, templates] = await Promise.all([
    getYouTubeChannelId(),
    getInstagramAccounts(),
    getBlueskyHandle(),
    getLatestTemplates(),
  ]);

  const posts = await getAllLatestSocialPosts({ youtubeChannelId, instagramAccounts, blueskyHandle, templates });
  await setSocialLatestPosts(posts);
  return posts;
}
