const substackRecentPosts = async () => {
  const profileUserId = 15755564;
  const offset = 0;
  const limit = 3;

  const url = new URL(
    "https://bnj5w7dzracgk7cfb2bjtnefii0fspbo.lambda-url.us-east-1.on.aws/"
  );
  url.searchParams.append("profile_user_id", profileUserId);
  url.searchParams.append("offset", offset);
  url.searchParams.append("limit", limit);

  try {
    const response = await fetch(url);
    const data = await response.json();
    const map = data.posts.reduce((acc, item) => {
      acc[item.title] = item.canonical_url;
      return acc;
    }, {});
    return map;
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
};

export default substackRecentPosts;
