import { API_BASE_URL } from "@/config/api.config";

/** Chuỗi URL ảnh tương đối từ API → URL đầy đủ. */
export function resolveMediaUrl(url) {
  if (url == null || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const base = API_BASE_URL.replace(/\/$/, "");
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}
