import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { Container } from "@/components/site/container";
import { getPostBySlug } from "@/lib/data/news";
import { formatPostDate, postDateTime } from "@/lib/news/format";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * A news article — `/news/[slug]`.
 *
 * `getPostBySlug` only returns published posts whose publish time has passed, so a
 * draft or a future-dated post is a 404 here, the same as a slug that never existed.
 *
 * There is no `generateStaticParams`. With `cacheComponents`, an empty list fails
 * the build, and no posts exist yet. Articles render on first request and are
 * cached after that. Add the function once there are posts to list.
 */

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { robots: { index: false, follow: false } };

  const path = `/news/${post.slug}`;
  const description = post.excerpt || "News from Imarisha Dada.";

  return {
    title: post.title,
    description,
    alternates: {
      canonical: path,
      languages: { "en-KE": path, "x-default": path },
    },
    openGraph: {
      type: "article",
      url: path,
      locale: "en_KE",
      title: `${post.title} | Imarisha Dada`,
      description,
      publishedTime: post.publishedAt,
      images: post.coverPath ? [post.coverPath] : ["/opengraph-image"],
    },
    twitter: {
      card: post.coverPath ? "summary_large_image" : "summary",
      title: `${post.title} | Imarisha Dada`,
      description,
    },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Paragraphs are split on blank lines and rendered as text nodes. The body is
  // plain text from the admin, so nothing in it can become markup.
  const paragraphs = post.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const path = `/news/${post.slug}`;

  return (
    <>
      <main id="main">
        <article className="py-section">
          <Container>
            <div className="mx-auto max-w-3xl">
              <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-muted">
                <Link
                  href="/news"
                  className="underline-offset-4 hover:text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
                >
                  ← All news
                </Link>
              </nav>

              <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
                {post.categoryLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-sm text-ink-muted">
                <time dateTime={postDateTime(post.publishedAt)}>{formatPostDate(post.publishedAt)}</time>
                <span> · {post.readingMinutes} min read</span>
              </p>

              {post.excerpt ? (
                <p className="mt-6 text-xl leading-relaxed text-ink">{post.excerpt}</p>
              ) : null}

              {post.coverPath && post.coverAlt ? (
                <figure className="mt-10">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card">
                    <Image
                      src={post.coverPath}
                      alt={post.coverAlt}
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                      preload
                    />
                  </div>
                </figure>
              ) : null}

              <div className="mt-10 space-y-6 text-lg leading-relaxed text-ink">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </Container>
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt,
              url: absoluteUrl(path),
              datePublished: post.publishedAt,
              inLanguage: "en-KE",
              ...(post.coverPath ? { image: absoluteUrl(post.coverPath) } : {}),
              author: { "@type": "Organization", name: "Imarisha Dada", url: absoluteUrl("/") },
              publisher: { "@type": "Organization", name: "Imarisha Dada", url: absoluteUrl("/") },
            },
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "News", path: "/news" },
              { name: post.title, path },
            ]),
          ]),
        }}
      />
    </>
  );
}
