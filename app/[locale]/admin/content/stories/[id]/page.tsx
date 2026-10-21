import { notFound } from "next/navigation";

import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { getStory } from "@/app/[locale]/admin/actions/stories";
import { StoryForm } from "@/components/admin/story-form";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createAuthServerClient();
  const [story, { data: programmes }] = await Promise.all([
    getStory(id),
    supabase.from("programmes").select("id, title").eq("active", true).order("sort_order"),
  ]);

  if (!story) notFound();

  return (
    <StoryForm
      initial={{
        id: story.id,
        slug: story.slug,
        title: story.title,
        excerpt: story.excerpt ?? "",
        body: story.body ?? "",
        quote: story.quote ?? "",
        attribution: story.attribution ?? "",
        consent_tier: story.consent_tier,
        consent_expires_at: story.consent_expires_at ?? "",
        image_path: story.image_path ?? "",
        image_alt: story.image_alt ?? "",
        reading_minutes: story.reading_minutes?.toString() ?? "",
        featured: story.featured,
        published: story.published,
        programme_id: story.programme_id ?? "",
      }}
      programmes={programmes ?? []}
    />
  );
}
