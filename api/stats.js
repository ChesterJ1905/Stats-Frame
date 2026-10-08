const TIKTOK_USERNAME = "jcubedhax";
const INSTAGRAM_USERNAME = "jcubedhax";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  let tiktok = {
    followers: 0,
    likes: 0,
    videos: 0
  };

  let instagram = {
    followers: 0,
    posts: 0,
    error: null
  };

  try {
    tiktok = await getTikTokProfile(TIKTOK_USERNAME);
  } catch (error) {
    console.error("TikTok error:", error);
  }

  try {
    instagram = await getInstagramProfile(INSTAGRAM_USERNAME);
  } catch (error) {
    console.error("Instagram error:", error);

    instagram.error = error.message;
  }

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
      posts: instagram.posts,
      error: instagram.error
    }
  });
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
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Instagram returned ${response.status}`);
  }

  const html = await response.text();

  const patterns = [
    /"follower_count":(\d+)/,
    /"edge_followed_by":\{"count":(\d+)\}/,
    /"followers":\{"count":(\d+)\}/
  ];

  let followers = null;

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match) {
      followers = Number(match[1]);
      break;
    }
  }

  if (followers === null) {
    throw new Error("Instagram blocked public follower data");
  }

  let posts = 0;

  const postPatterns = [
    /"media_count":(\d+)/,
    /"edge_owner_to_timeline_media":\{"count":(\d+)/
  ];

  for (const pattern of postPatterns) {
    const match = html.match(pattern);

    if (match) {
      posts = Number(match[1]);
      break;
    }
  }

  return {
    followers,
    posts,
    error: null
  };
}