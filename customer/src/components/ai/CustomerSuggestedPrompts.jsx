/**
 * Suggested prompts cho khách (`ai_intergrate.md` §11.3 + §11.4).
 */
const PROMPTS = {
  b2b: [
    'Tôi còn nợ bao nhiêu?',
    'Đơn ORD-... đang ở đâu?',
    'Hóa đơn nào sắp đến hạn?',
    'Báo giá QT-... đã được duyệt chưa?',
  ],
  b2c: [
    'Tra đơn B2C2026... cho tôi trạng thái',
    'Tìm sản phẩm dưới 5 triệu đồng',
    'MacVilla có hỗ trợ giao hàng / thanh toán thế nào?',
    'Chậu BANCOOT CIELO 1102 có mấy hố, chất liệu gì?',
  ],
}

export function CustomerSuggestedPrompts({ namespace, onPick, disabled }) {
  const items = PROMPTS[namespace] || PROMPTS.b2c
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Bạn có thể bắt đầu bằng
      </p>
      <div className="flex flex-col gap-2">
        {items.map((text) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onPick(text)}
            className={[
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition-colors',
              'hover:border-[#004a99]/40 hover:bg-[#004a99]/5 hover:text-slate-900',
              'disabled:cursor-not-allowed disabled:opacity-60',
            ].join(' ')}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
