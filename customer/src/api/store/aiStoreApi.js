import { apiJson } from '../httpClient'

/**
 * Trợ lý Gemini cho khách B2C — `ai_intergrate.md` §5.
 * Endpoint: `/api/store/ai/*`. JWT lấy từ `/api/store/auth/login`.
 *
 * @typedef {{ toolName: string, latencyMs?: number, success?: boolean }} AiToolUsed
 * @typedef {{ threadId: number, assistantMessage: string, toolsUsed?: AiToolUsed[], tokensIn?: number, tokensOut?: number, latencyMs?: number }} AiChatResponse
 * @typedef {{ id: number, role: string, title: string, createdAt: string, updatedAt: string, messageCount: number, lastMessagePreview?: string }} AiThreadSummary
 * @typedef {{ id: number, messageRole: 'user'|'assistant'|'tool', content?: string, toolName?: string, toolArgsJson?: string, toolResultJson?: string, createdAt: string }} AiMessage
 */

const BASE = '/api/store/ai'

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
