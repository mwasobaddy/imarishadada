import { notFound } from "next/navigation";

import { getPost } from "@/app/[locale]/admin/actions/posts";
import { PostForm } from "@/components/admin/post-form";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <PostForm
      initial={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt ?? "",
        body: post.body ?? "",
        category: post.category,
        tags: Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags ?? ""),
        cover_path: post.cover_path ?? "",
        cover_alt: post.cover_alt ?? "",
        reading_minutes: post.reading_minutes?.toString() ?? "",
        published: post.published,
      }}
    />
  );
}
