import { getCollection, type CollectionEntry } from "astro:content";

export async function publishedEssays() {
  return (await getCollection("essays", ({ data }) => !data.draft))
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}

export function readingTime(essay: CollectionEntry<"essays">) {
  return Math.max(1, Math.ceil((essay.body ?? "").split(/\s+/).length / 220));
}

export function href(path = "") {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
