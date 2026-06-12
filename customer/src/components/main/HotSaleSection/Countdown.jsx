/**
 * Simple countdown display (hours : minutes : seconds)
 * Can be extended later with real countdown logic
 */
const DEFAULT_TIME = { hours: '05', minutes: '45', seconds: '12' }

export function Countdown(props) {
  const { hours: h = DEFAULT_TIME.hours, minutes: m = DEFAULT_TIME.minutes, seconds: s = DEFAULT_TIME.seconds } =
    props ?? {}

  return (
    <div className="flex items-center gap-2 ml-4">
      <span className="bg-black text-white px-2 py-1 rounded font-bold text-lg">
        {h}
      </span>
      <span className="text-white font-bold">:</span>
      <span className="bg-black text-white px-2 py-1 rounded font-bold text-lg">
        {m}
      </span>
      <span className="text-white font-bold">:</span>
      <span className="bg-black text-white px-2 py-1 rounded font-bold text-lg">
        {s}
      </span>
    </div>
  )
}
