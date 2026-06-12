/**
 * Top announcement bar (promo message)
 */
export function AnnouncementBar() {
  const message =
    '🔥 Cam kết 1 đổi 1 trong 30 ngày nếu có lỗi từ nhà sản xuất. Miễn phí lắp đặt nội thành!'

  return (
    <div className="bg-secondary text-white text-center py-2 text-sm font-medium">
      {message}
    </div>
  )
}
