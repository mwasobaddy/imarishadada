import { PagesEditorSkeleton } from "@/components/admin/admin-skeletons";

/**
 * The loading state for the page editor.
 *
 * The editor is the heaviest read in the admin — every section on the page,
 * plus the published data the previews render — so it is the one admin screen
 * where a placeholder earns its place. The shape is the editor's shape, so
 * nothing jumps when the sections arrive.
 */
export default function PagesEditorLoading() {
  return <PagesEditorSkeleton />;
}
