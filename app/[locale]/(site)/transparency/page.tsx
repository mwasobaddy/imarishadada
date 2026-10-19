import { ProseRoute, proseMetadata } from "@/components/site/prose-route";
import { TRANSPARENCY_PAGE } from "@/lib/data/pages";
import { setRequestLocale } from "next-intl/server";

/** See doc/roadmap/transparency.md. Content lives in lib/data/pages.ts. */
export const metadata = proseMetadata(TRANSPARENCY_PAGE);

export default async function Page({
  params,
}: PageProps<"/[locale]/transparency">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  return <ProseRoute slug="transparency" />;
}
