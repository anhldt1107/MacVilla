/**
 * Chuẩn hóa errors từ API (field PascalCase hoặc camelCase) → một object để bind form.
 * @param {Record<string, string[] | string> | undefined} errors
 * @returns {Record<string, string>}
 */
export function mapValidationErrorsToFirstMessage(errors) {
  if (!errors || typeof errors !== 'object') return {}
  /** @type {Record<string, string>} */
  const out = {}
  for (const [key, val] of Object.entries(errors)) {
    const k = key.charAt(0).toLowerCase() + key.slice(1)
    if (Array.isArray(val) && val.length > 0) {
      out[k] = String(val[0])
    } else if (typeof val === 'string') {
      out[k] = val
    }
  }
  return out
}
