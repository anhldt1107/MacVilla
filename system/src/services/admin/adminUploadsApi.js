import { apiUrl } from "@/config/api.config";
import { bearerHeaders } from "@/services/api/http";
import { parseApiEnvelope } from "@/services/api/apiEnvelope";

/**
 * @typedef {object} AdminUploadResult
 * @property {string} secureUrl
 * @property {string} [publicId]
 * @property {string} [resourceType]
 * @property {string} [format]
 * @property {number} [bytes]
 * @property {string} [originalFileName]
 */

/**
 * POST /api/admin/uploads?folder=…
 * @param {string} accessToken
 * @param {File} file
 * @param {string} [folder] mặc định "product"
 * @returns {Promise<AdminUploadResult>}
 */
export async function uploadAdminFile(accessToken, file, folder = "product") {
  if (!accessToken) throw new Error("Chưa có access token.");
  if (!file || !(file instanceof File)) throw new Error("Chưa chọn tệp hợp lệ.");

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(apiUrl(`/api/admin/uploads?folder=${encodeURIComponent(folder)}`), {
    method: "POST",
    headers: {
      Accept: "*/*",
      ...bearerHeaders(accessToken),
    },
    body: form,
  });

  return parseApiEnvelope(res);
}
