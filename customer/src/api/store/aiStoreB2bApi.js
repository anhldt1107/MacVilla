import { apiJson } from '../httpClient'

/**
 * Trợ lý Gemini cho khách B2B — `ai_intergrate.md` §4.
 * Endpoint: `/api/store/b2b/ai/*`. JWT lấy từ `/api/store/b2b/auth/login`.
 *
 * @typedef {import('./aiStoreApi.js').AiToolUsed} AiToolUsed
 * @typedef {import('./aiStoreApi.js').AiChatResponse} AiChatResponse
 * @typedef {import('./aiStoreApi.js').AiThreadSummary} AiThreadSummary
 * @typedef {import('./aiStoreApi.js').AiMessage} AiMessage
 */

const BASE = '/api/store/b2b/ai'

/**
 * @param {string} token
 * @param {{ threadId?: number | null, message: string }} body
 * @returns {Promise<AiChatResponse>}
 */
export function postAiChat(token, body) {
  return apiJson(`${BASE}/chat`, {
    method: 'POST',
    token,
    json: {
      threadId: body.threadId ?? null,
      message: String(body.message ?? '').trim(),
    },
  }).then((r) => r.data)
}

/**
 * @param {string} token
 * @param {{ page?: number, pageSize?: number }} [query]
 * @returns {Promise<{ items: AiThreadSummary[], totalCount: number, page: number, pageSize: number }>}
 */
export function fetchAiThreads(token, query = {}) {
  const page = Number(query.page ?? 1)
  const pageSize = Number(query.pageSize ?? 20)
  return apiJson(`${BASE}/threads?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * @param {string} token
 * @param {number | string} threadId
 * @returns {Promise<AiMessage[]>}
 */
export function fetchAiThreadMessages(token, threadId) {
  const id = encodeURIComponent(String(threadId))
  return apiJson(`${BASE}/threads/${id}/messages`, {
    method: 'GET',
    token,
  }).then((r) => r.data)
}

/**
 * @param {string} token
 * @param {number | string} threadId
 */
export function deleteAiThread(token, threadId) {
  const id = encodeURIComponent(String(threadId))
  return apiJson(`${BASE}/threads/${id}`, {
    method: 'DELETE',
    token,
  })
}
