import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Required in Next 16. Default is [75]; out-of-range values are coerced and
    // a direct request for a disallowed quality returns 400.
    qualities: [60, 75, 85],
    // Widens the small-variant ladder so a 390–430px phone gets a ~400px image
    // instead of being rounded up to the 640px device size.
    imageSizes: [64, 96, 128, 160, 200, 400, 480, 640, 750, 828, 1080, 1200, 1920],
    // Every field is specified explicitly. Omitting protocol/port/pathname/search
    // implies a `**` wildcard, which is not recommended — it lets the optimiser
    // fetch URLs you did not intend.
    //
    // Currently unused: the hero portrait is vendored under public/images so the
    // optimiser reads from local disk. Add an entry here when a remote image
    // bucket (e.g. Supabase Storage) becomes a source.
    remotePatterns: [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;