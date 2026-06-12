/**
 * Base URL API (không có trailing slash). Ví dụ: http://localhost:5276
 * @see .env.example
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || ''

export function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    console.warn(
      '[api] Thiếu VITE_API_BASE_URL. Tạo file .env với VITE_API_BASE_URL trỏ tới BE.'
    )
  }
}
