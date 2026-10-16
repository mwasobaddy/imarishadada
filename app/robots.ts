import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/donate` is deliberately NOT disallowed — it is the highest-intent
        // URL on the site. Hiding it from Google is self-inflicted traffic loss.
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: "https://imarishadada.org/sitemap.xml",
    host: "https://imarishadada.org",
  };
}