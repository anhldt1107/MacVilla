import {
  returnExchangeStatusLabel,
  returnExchangeStepLabels,
} from '../../lib/returnExchangeStatus'

/**
 * @param {{ status?: string | null }} props
 */
export function ReturnExchangeStatusStepper({ status }) {
  const { terminal, steps, current } = returnExchangeStepLabels(status)

  if (terminal) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Trạng thái kết thúc: {returnExchangeStatusLabel(status)}
      </p>
    )
  }

  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={label}
            className={`rounded-full px-2.5 py-1 font-medium ring-1 ${
              done
                ? 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100'
                : active
                  ? 'bg-violet-50 text-violet-900 ring-violet-300 dark:bg-violet-950/40'
                  : 'bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-900'
            }`}
          >
            {label}
          </li>
        )
      })}
    </ol>
  )
}
