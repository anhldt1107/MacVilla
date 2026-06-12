import { Icon } from '../../ui/Icon'

const FEATURES = [
  { icon: 'wifi', label: 'Kết nối Wifi' },
  { icon: 'eco', label: 'Tiết kiệm điện' },
  { icon: 'verified_user', label: 'An toàn 100%' },
  { icon: 'schedule', label: 'Hẹn giờ tắm' },
]

const IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCUQZbJEX2lZd6nfO3IGmCAOPjdqyo4rXUXLnbZwrQwE4nseggVdgXO9OFs08IrbSTS-H3WvYKCo3i5aX30DPy1vVnf_obrmHVct-jBMVvPG06jCLeIHK3183KMFhQK3SSqtzvm7K6k3cJ-w2q_0J4kHcSyUVys_FTQg7q__J9G6dvZ-HEpKSf-0nuRodGhGu2ogzyGTng1yH6hPW4xHiniFFTzUBINlDcbe5qWznpkapbZyykWWdJhvjgB9CPrWA6TPxq9V_TpvB71'

export function SmartHomeSection() {
  return (
    <section className="mt-16">
      <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">
              Giải pháp nhà thông minh
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
              Giải Pháp Nước Nóng Thông Minh Ariston
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Tích hợp công nghệ Wifi, điều khiển từ xa qua smartphone. Tiết
              kiệm năng lượng tối đa và an toàn tuyệt đối với hệ thống chống
              giật ELCB thế hệ mới.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {FEATURES.map(({ icon, label }) => (
                <div key={icon} className="flex items-center gap-2">
                  <Icon name={icon} className="text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="bg-primary text-white font-bold px-8 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Xem các mẫu bình nóng lạnh thông minh
            </button>
          </div>
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
            <img
              src={IMAGE_URL}
              alt="Ứng dụng điều khiển bình nóng lạnh thông minh"
              className="relative z-10 rounded-2xl shadow-2xl object-cover aspect-video"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
