import { ApiError } from '../../api/httpClient'

/**
 * @param {unknown} err
 * @returns {string}
 */
export function getApiErrorMessage(err) {
  if (err instanceof ApiError) return err.message
  if (err instanceof TypeError) {
    if (err.message === 'Failed to fetch') {
      return 'Không kết nối được máy chủ. Kiểm tra VITE_API_BASE_URL và CORS.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}
