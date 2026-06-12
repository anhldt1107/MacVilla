import { BRAND_LOGO_SRC, BRAND_NAME } from '../../../lib/brand'

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-white shrink-0">
      <span className="rounded-md bg-white/95 p-1 shadow-sm ring-1 ring-white/30">
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          className="h-8 w-auto max-w-[148px] object-contain object-left"
        />
      </span>
      <span className="text-[10px] opacity-90 uppercase tracking-widest hidden sm:inline text-white">
        Thiết bị cao cấp
      </span>
    </div>
  )
}
