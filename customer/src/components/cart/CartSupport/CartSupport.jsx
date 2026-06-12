import { Icon } from '../../ui/Icon'

export function CartSupport({ title, hotline, hours }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
        <Icon name="headset_mic" />
      </div>
      <div>
        <p className="text-xs font-bold text-primary">{title}</p>
        <p className="text-lg font-bold text-primary">{hotline}</p>
        <p className="text-[10px] text-primary/70">{hours}</p>
      </div>
    </div>
  )
}
