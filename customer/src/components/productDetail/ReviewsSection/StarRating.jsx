import { Icon } from '../../ui/Icon'

export function StarRating({ value }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half

  return (
    <div className="flex text-yellow-500 scale-75 origin-left">
      {Array.from({ length: full }, (_, i) => (
        <Icon key={`f-${i}`} name="star" className="fill-1" />
      ))}
      {half ? <Icon name="star_half" /> : null}
      {Array.from({ length: empty }, (_, i) => (
        <Icon key={`e-${i}`} name="star" />
      ))}
    </div>
  )
}
