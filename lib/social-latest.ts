import { renderLatestTemplate, type LatestTemplates } from "./latest-templates";

export type SocialPost = {
  platform: "YouTube" | "Instagram" | "Bluesky";
  account: string;
  text: string;
  href: string;
  publishedAt: string;
};

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
  };
}

async function fetchLatestInstagram(account: InstagramAccount, templates: LatestTemplates): Promise<SocialPost | null> {
  const res = await fetch(
    `https://graph.instagram.com/v21.0/${account.userId}/media?fields=permalink,media_product_type,timestamp&limit=1&access_token=${account.accessToken}`,
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
  };
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
    post: { uri: string; record?: { createdAt?: string }; indexedAt: string };
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
