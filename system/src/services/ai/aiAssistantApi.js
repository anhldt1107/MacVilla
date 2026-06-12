/**
 * Trợ lý Gemini cho staff (Admin/Manager/Sales) — `ai_intergrate.md` §3.1, 4–7.
 * Endpoint: `/api/admin/ai/*`. Bearer JWT staff (`/api/Auth/login`).
 */
import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope, ApiRequestError } from "@/services/api/apiEnvelope";

const BASE = "/api/admin/ai";

/**
 * @typedef {object} AiToolUsed
 * @property {string} toolName
 * @property {number} [latencyMs]
 * @property {boolean} [success]
 *
 * @typedef {object} AiChatResponse
 * @property {number} threadId
 * @property {string} assistantMessage
 * @property {AiToolUsed[]} [toolsUsed]
 * @property {number} [tokensIn]
 * @property {number} [tokensOut]
 * @property {number} [latencyMs]
 *
 * @typedef {object} AiThreadSummary
 * @property {number} id
 * @property {string} role
 * @property {string} title
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} messageCount
 * @property {string} [lastMessagePreview]
 *
 * @typedef {object} AiMessage
 * @property {number} id
 * @property {"user" | "assistant" | "tool"} messageRole
 * @property {string} [content]
 * @property {string} [toolName]
 * @property {string} [toolArgsJson]
 * @property {string} [toolResultJson]
 * @property {string} createdAt
 */

/**
 * @param {string} accessToken
 * @param {RequestInit} [init]
 */
async function request(accessToken, path, init = {}) {
  if (!accessToken) {
    throw new ApiRequestError("Chưa có access token.", "UNAUTHORIZED");
  }
  const headers = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...bearerHeaders(accessToken),
    ...(init.headers || {}),
  };
  const res = await fetch(apiUrl(`${BASE}${path}`), { ...init, headers });
  return parseApiEnvelope(res);
}

/**
 * @param {string} accessToken
 * @param {{ threadId?: number | null; message: string }} body
 * @returns {Promise<AiChatResponse>}
 */
export function postAiChat(accessToken, body) {
  return request(accessToken, "/chat", {
    method: "POST",
    body: JSON.stringify({
      threadId: body.threadId ?? null,
      message: String(body.message ?? "").trim(),
    }),
  });
}

/**
 * @param {string} accessToken
 * @param {{ page?: number; pageSize?: number }} [query]
 * @returns {Promise<{ items: AiThreadSummary[]; totalCount: number; page: number; pageSize: number }>}
 */
export function fetchAiThreads(accessToken, query = {}) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  return request(accessToken, `/threads?page=${page}&pageSize=${pageSize}`, { method: "GET" });
}

/**
 * @param {string} accessToken
 * @param {number | string} threadId
 * @returns {Promise<AiMessage[]>}
 */
export function fetchAiThreadMessages(accessToken, threadId) {
  const id = encodeURIComponent(String(threadId));
  return request(accessToken, `/threads/${id}/messages`, { method: "GET" });
}

/**
 * @param {string} accessToken
 * @param {number | string} threadId
 */
export function deleteAiThread(accessToken, threadId) {
  const id = encodeURIComponent(String(threadId));
  return request(accessToken, `/threads/${id}`, { method: "DELETE" });
}
