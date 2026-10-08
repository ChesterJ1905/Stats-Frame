const TIKTOK_USERNAME = "jcubedhax";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    const tiktok = await getTikTokProfile(TIKTOK_USERNAME);

    const data = {
      displayName: `@${TIKTOK_USERNAME}`,
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
        handle: "@jcubedhax",
        views: 0,
        followers: 0
      }
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("TikTok error:", error);

    res.status(500).json({
      error: "Could not load TikTok data",
      message: error.message
    });
  }
}

async function getTikTokProfile(username) {
  const url = `https://www.tiktok.com/@${username}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`TikTok returned HTTP ${response.status}`);
  }

  const html = await response.text();

  const match = html.match(
    /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error(
      "TikTok profile data was not found. TikTok may have blocked this request."
    );
  }

  const json = JSON.parse(match[1]);

  const detail =
    json?.__DEFAULT_SCOPE__?.["webapp.user-detail"];

  if (!detail?.userInfo) {
    throw new Error("TikTok user data was missing.");
  }

  const userInfo = detail.userInfo;

  const statsV2 = userInfo.statsV2 || {};
  const stats = userInfo.stats || {};

  const followers =
    Number(statsV2.followerCount ?? stats.followerCount ?? 0);

  const likes =
    Number(
      statsV2.heartCount ??
      statsV2.heart ??
      stats.heartCount ??
      stats.heart ??
      0
    );

  const videos =
    Number(statsV2.videoCount ?? stats.videoCount ?? 0);

  return {
    followers,
    likes,
    videos
  };
}