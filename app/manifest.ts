import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Imarisha Dada",
    short_name: "Imarisha Dada",
    description: "Empowering girls and young women in Kibera, Nairobi",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFAF7",
    theme_color: "#5B2A86",
    // SVG icons. The PWA spec supports SVG in the manifest (Chrome 93+,
    // Edge 93+, Firefox 95+), and it scales to every size without a separate
    // PNG per density. `sizes: "any"` tells the browser the icon is
    // resolution-independent. Older Android devices fall back to the
    // `app/icon.svg` that Next serves at `/icon.svg`.
    icons: [
      { src: "/brand/mark.svg", sizes: "any", type: "image/svg+xml" },
      // Maskable: the mark is centred in a square canvas, so it survives
      // Android's circular mask without clipping. Re-check if the mark's
      // artwork changes.
      { src: "/brand/mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}