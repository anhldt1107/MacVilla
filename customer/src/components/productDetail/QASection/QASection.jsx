export function QASection({ items = [] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8">
      <h3 className="text-xl font-bold mb-4">Hỏi đáp</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            <p className="text-sm font-bold text-primary">
              Q: {item.question}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              A: {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
