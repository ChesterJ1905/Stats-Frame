const TIKTOK_USERNAME = "jcubedhax";
const INSTAGRAM_USERNAME = "jcubedhax";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    const [tiktok, instagram] = await Promise.all([
      getTikTokProfile(TIKTOK_USERNAME),
      getInstagramProfile(INSTAGRAM_USERNAME)
    ]);

    res.status(200).json({
      displayName: "@jcubedhax",
      updatedAt: new Date().toISOString(),

      weeklyViewsChange: 0,
      weeklyFollowersChange: 0,

      tiktok: {
        handle: `@${TIKTOK_USERNAME}`,
        views: 0,
        followers: tiktok.followers,
        likes: tiktok.likes,
        videos: tiktok.videos
      },

      instagram: {
        handle: `@${INSTAGRAM_USERNAME}`,
        views: 0,
        followers: instagram.followers,
        posts: instagram.posts
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Could not load social data",
      message: error.message
    });
  }
}

async function getTikTokProfile(username) {
  const response = await fetch(
    `https://www.tiktok.com/@${username}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`TikTok returned ${response.status}`);
  }

  const html = await response.text();

  const match = html.match(
    /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error("TikTok profile data not found");
  }

  const json = JSON.parse(match[1]);

  const info =
    json?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;

  if (!info) {
    throw new Error("TikTok user info missing");
  }

  const stats = info.statsV2 || info.stats || {};

  return {
    followers: Number(stats.followerCount || 0),
    likes: Number(stats.heartCount || stats.heart || 0),
    videos: Number(stats.videoCount || 0)
  };
}

async function getInstagramProfile(username) {
  const response = await fetch(
    `https://www.instagram.com/${username}/`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Instagram returned ${response.status}`);
  }

  const html = await response.text();

  const followerMatch =
    html.match(/"edge_followed_by":\{"count":(\d+)\}/) ||
    html.match(/"follower_count":(\d+)/) ||
    html.match(/"followers":\{"count":(\d+)\}/);

  const postMatch =
    html.match(/"edge_owner_to_timeline_media":\{"count":(\d+)/) ||
    html.match(/"media_count":(\d+)/);

  if (!followerMatch) {
    throw new Error(
      "Instagram follower data was not found in the public page"
    );
  }

  return {
    followers: Number(followerMatch[1]),
    posts: postMatch ? Number(postMatch[1]) : 0
  };
}