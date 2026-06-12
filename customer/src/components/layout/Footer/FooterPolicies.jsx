import { FOOTER_POLICIES } from '../../../data/footer'

export function FooterPolicies() {
  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-sm tracking-widest">
        Chính Sách
      </h3>
      <ul className="space-y-4 text-sm text-slate-500">
        {FOOTER_POLICIES.map((item) => (
          <li key={item.label}>
            <a
              className="hover:text-primary transition-colors"
              href={item.href}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
