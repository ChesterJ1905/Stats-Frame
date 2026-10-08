export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  const data = {
    displayName: "@youraccount",

    updatedAt:
      new Date().toISOString(),

    weeklyViewsChange: 284300,

    weeklyFollowersChange: 2180,

    tiktok: {
      handle: "@youraccount",
      views: 8432800,
      followers: 128400
    },

    instagram: {
      handle: "@youraccount",
      views: 2951400,
      followers: 63700
    }
  };

  res.status(200).json(data);
}