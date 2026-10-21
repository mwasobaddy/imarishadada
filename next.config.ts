import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Required for `app/global-not-found.tsx`.
    //
    // The root layout is now a top-level dynamic segment (`app/[locale]`), so
    // Next cannot compose a consistent 404 from a layout plus a `not-found`
    // file. Without this flag, an unmatched URL gets an auto-generated
    // `<html>` with no `lang` attribute and no font or theme classes — so a
    // screen reader does not know the language and the page renders in the
    // wrong theme.
    //
    // @see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md
    globalNotFound: true,
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
    // The media library stores uploaded photographs in Supabase Storage, and
    // the only publicly readable bucket is `public-media`. Without this the
    // optimiser refuses every uploaded image, because the pathname, the search
    // string and the port are all specified: a wildcard here would let any
    // host serve an image into the site.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qbipjvbbpgggempnzfrp.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/public-media/**",
        search: "",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "imarishadada.org" }],
        destination: "https://www.imarishadada.org/:path*",
        permanent: true,
      },
    ];
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

/**
 * `next-intl/plugin` wires the request config into the build so message
 * catalogues are typed and a missing key fails at compile time rather than
 * rendering a raw key string at runtime.
 */
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);