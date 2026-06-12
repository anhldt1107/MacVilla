import { FOOTER_BADGES } from '../../../data/footer'

export function FooterBadges() {
  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest">
        Chứng Nhận
      </h3>
      <div className="flex flex-wrap gap-4">
        {FOOTER_BADGES.map((label) => (
          <div
            key={label}
            className="w-24 h-12 bg-slate-100 rounded flex items-center justify-center grayscale"
          >
            <span className="text-[10px] font-bold text-slate-400 border border-slate-300 px-1 italic">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
