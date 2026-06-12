/**
 * Tab Tra cứu bảo hành - sản phẩm đã đăng ký bảo hành
 */
export const WARRANTY_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang bảo hành' },
]

export const WARRANTY_PRODUCTS = [
  {
    id: 'MV-88291',
    name: 'Bếp từ Bosch HMH.PVJ631FB1E',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj02QMDut3hnk74j4rxsmkvcnRM-WA4WosCK_bZFZTmZR2sG9r0IZGDXgtHqHgcyMJeHbEnaPTavDUZ44m-bO9tntH1EdKT62I_i_2mI-LYFaCc4u9soLuZq-XYfh-ROT7PoR1cw0k2WQ2Ttc8wxkm-5Mi0fQpdwQsImaSwjqo8jQHu2VJVQOVlmQZwYDlDruheazc-MToxQIzsC3uSkbYcMM1_a1gOpaxm1nQwdaK0PinxFQDkaCGnSGXSzpXrUo7Mnir6sC4TMKT',
    imageAlt: 'Bếp từ Bosch',
    status: 'active',
    statusLabel: 'Còn hạn',
    statusClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    activatedDate: '12/10/2023',
    remainingLabel: '14 tháng',
    remainingClass: 'text-primary font-semibold',
    progressPercent: 65,
    progressBarClass: 'bg-primary',
    canRepair: true,
  },
  {
    id: 'MV-10293',
    name: 'Bộ vòi sen cây TOTO TBW01401B',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmUmefGOFpJOWeITqHkxSUuLNKy_P4lrAvQA2hWb7SqdZxrz4zI6wh2PD_wNqeQQIXEGgruyqj3kUpS5utJcGugfUAM3PUIt8jFEHsLsOQpuwDhJLJgqmIWJOxrGewqTfW3-FsO_cPHH554yyEsXb8LY6KmRDdduJGrhhF6s5FLIDcVrIwE9C7XditrQwvwZSYYIwyHjNAvfw-ze0QevJm42XeqxXHprBQgm5QURds8aROxq3givEgAow4U5SvAO7kJHf0yhfZPl2d',
    imageAlt: 'Vòi sen TOTO',
    status: 'expired',
    statusLabel: 'Hết hạn',
    statusClass: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    activatedDate: '05/01/2021',
    remainingLabel: 'Đã hết hạn',
    remainingClass: 'text-red-500 font-semibold',
    progressPercent: 100,
    progressBarClass: 'bg-red-500',
    canRepair: false,
  },
  {
    id: 'MV-55410',
    name: 'Tủ lạnh Hitachi R-FW690PGV7',
    image: null,
    imageIcon: 'kitchen',
    imageAlt: 'Tủ lạnh Hitachi',
    status: 'active',
    statusLabel: 'Còn hạn',
    statusClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    activatedDate: '20/05/2024',
    remainingLabel: '22 tháng',
    remainingClass: 'text-primary font-semibold',
    progressPercent: 90,
    progressBarClass: 'bg-primary',
    canRepair: true,
  },
]
