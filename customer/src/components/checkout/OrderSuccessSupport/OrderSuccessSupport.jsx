import { Icon } from '../../ui/Icon'

export function OrderSuccessSupport() {
  return (
    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-8 text-center border border-primary/10">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Bạn cần hỗ trợ thêm?
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
        Đội ngũ chăm sóc khách hàng của Macvilla luôn sẵn sàng giải đáp
        mọi thắc mắc của bạn.
      </p>
      <div className="flex flex-wrap justify-center gap-4 items-center">
        <a
          href="tel:19001234"
          className="flex items-center gap-2 text-primary font-bold hover:underline"
        >
          <Icon name="call" />
          1900 1234
        </a>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <a
          href="mailto:support@macvilla.site"
          className="flex items-center gap-2 text-primary font-bold hover:underline"
        >
          <Icon name="mail" />
          support@macvilla.site
        </a>
      </div>
    </div>
  )
}
