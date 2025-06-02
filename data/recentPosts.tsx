interface Post {
  title: string;
  canonical_url: string;
  subtitle: string;
}

interface DataResponse {
  posts: Post[];
}

import { LinkListElement } from "@/app/components/LinkList";

export const recentPosts = async () => {
  const profileUserId = "15755564";
  const offset = "0";
  const limit = "3";

  const url = new URL(
    "https://bnj5w7dzracgk7cfb2bjtnefii0fspbo.lambda-url.us-east-1.on.aws/"
  );
  url.searchParams.append("profile_user_id", profileUserId);
  url.searchParams.append("offset", offset);
  url.searchParams.append("limit", limit);

  try {
    const response = await fetch(url);
    const data: DataResponse = await response.json();
    const posts: Array<LinkListElement> = [];
    data.posts.map((post) => {
      posts.push({
        name: post.title,
        href: post.canonical_url,
        blurb: post.subtitle,
      });
    });
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
};
