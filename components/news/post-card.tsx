import Image from "next/image";
import Link from "next/link";

import type { NewsCard } from "@/lib/data/news";
import { formatPostDate, postDateTime } from "@/lib/news/format";

/**
 * One post in the index.
 *
 * The cover sits on top, as a reader expects. Its alt text is required by the
 * database, so the picture is never announced as an unlabelled image. The whole
 * card is a single link on the title, so it is one tab stop.
 *
 * The image box has a fixed aspect ratio, so a late-loading cover cannot push the
 * text down, and a card without a cover keeps the same text position.
 */
export function PostCard({ post, featured = false }: { post: NewsCard; featured?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card transition-shadow hover:shadow-md focus-within:shadow-md">
      {post.coverPath && post.coverAlt ? (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={post.coverPath}
            alt={post.coverAlt}
            fill
            sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"}
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium tracking-wide text-brand-600 uppercase">
          {post.categoryLabel}
        </p>
        <h3 className={`mt-2 font-semibold text-ink ${featured ? "text-2xl" : "text-lg"}`}>
          <Link
            href={`/news/${post.slug}`}
            className="underline-offset-4 decoration-brand-600/40 group-hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 text-xs text-ink-muted">
          <time dateTime={postDateTime(post.publishedAt)}>{formatPostDate(post.publishedAt)}</time>
          {post.readingMinutes ? <span> · {post.readingMinutes} min read</span> : null}
        </p>
        {post.excerpt ? (
          <p className="measure mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>
        ) : null}
      </div>

    </article>
  );
}
