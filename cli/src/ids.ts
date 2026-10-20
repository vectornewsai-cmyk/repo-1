/**
 * ids.ts — Sinh ID duy nhất cho clip/track.
 */

/** ID ngẫu nhiên ngắn, an toàn cho JSON và FFmpeg. */
export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${rand}`;
}

/** Slug hoá tên project thành tên file an toàn. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "project"
  );
}
