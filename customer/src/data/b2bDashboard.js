/**
 * Dashboard B2B / Khách doanh nghiệp (Construction Portal)
 */

/**
 * Sidebar B2B — căn chỉnh Documents/UI/customer-b2b.md (JWT customer, api/store/b2b/...).
 * Các màn chưa có UI: dùng PartnerPlaceholderPage + route tương ứng.
 */
export const B2B_SIDEBAR_NAV = [
  {
    id: 'home',
    icon: 'dashboard',
    label: 'Trang chủ',
    href: '/partner/dashboard',
    children: [],
  },
  {
    id: 'quotation',
    icon: 'request_quote',
    label: 'Báo giá',
    children: [
      { label: 'Yêu cầu báo giá mới', href: '/partner/quotation/create' },
      { label: 'Danh sách báo giá', href: '/partner/quotation/history' },
    ],
  },
  {
    id: 'contracts',
    icon: 'gavel',
    label: 'Hợp đồng',
    children: [{ label: 'Danh sách hợp đồng', href: '/partner/contracts' }],
  },
  {
    id: 'orders',
    icon: 'shopping_cart',
    label: 'Đơn hàng',
    href: '/partner/orders',
    children: [],
  },
  {
    id: 'finance',
    icon: 'account_balance',
    label: 'Tài chính',
    href: '/partner/payments/debt',
    children: [],
  },
  {
    id: 'after_sales',
    icon: 'build',
    label: 'Hậu mãi',
    children: [
      { label: 'Đổi / trả hàng', href: '/partner/after-sales/returns' },
      { label: 'Bảo hành', href: '/partner/after-sales/warranty' },
    ],
  },
  {
    id: 'company',
    icon: 'business',
    label: 'Tài khoản doanh nghiệp',
    children: [
      { label: 'Hồ sơ', href: '/partner/company' },
      { label: 'Sổ địa chỉ', href: '/partner/company/addresses' },
    ],
  },
]

export const B2B_COMPANY_HEADER = {
  name: 'Macvilla',
  badge: 'VIP Member',
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfxPJcs3tSyPXhTY9LF0pEvq472eGrB5gUK_-rC0wr1nqX3URAESChK8tr8X8R2na40TWdp6nF1SgRIpSpXtMb2yKBcy_3sOedTKE2R_S6Deht8yH6CEh538OXDUyTvDVKEcykB0Jo3JxmLSIBp6hNHDrNykEK_DFi30Wkbn5Rn1DJ3MPXG8whq5nbwepDz6QpkZ8bRa_C9-6lWs_VOB1Rr7GCPHHtgKB3q2uLxYEkq355TZiyeLizFlvAQpZNfJ9I0EEjIPdkW8Ij',
}

/** Tab trạng thái đơn hàng B2B */
export const B2B_ORDERS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'processing', label: 'Đang xử lý' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
]

/** Danh sách đơn hàng B2B (clone temp.html) */
export const B2B_ORDERS_LIST = [
  {
    id: 'ORD-2024-001',
    date: '12/05/2024',
    project: 'Vinhome Grand Park',
    projectSub: 'TP. Thủ Đức',
    total: '15.420.000đ',
    status: 'Chờ xác nhận',
    statusClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    canDownload: true,
  },
  {
    id: 'ORD-2024-002',
    date: '11/05/2024',
    project: 'Cáp điện lực Miền Nam',
    projectSub: null,
    total: '42.850.000đ',
    status: 'Đang xử lý',
    statusClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    canDownload: true,
  },
  {
    id: 'ORD-2024-003',
    date: '10/05/2024',
    project: 'Sunshine City Sài Gòn',
    projectSub: null,
    total: '8.120.000đ',
    status: 'Đang giao',
    statusClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    canDownload: true,
  },
  {
    id: 'ORD-2024-004',
    date: '08/05/2024',
    project: 'Bệnh viện Chợ Rẫy 2',
    projectSub: null,
    total: '124.600.000đ',
    status: 'Hoàn thành',
    statusClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    canDownload: true,
  },
  {
    id: 'ORD-2024-005',
    date: '05/05/2024',
    project: 'Dự án Nhà máy Intel',
    projectSub: null,
    total: '3.500.000đ',
    status: 'Đã hủy',
    statusClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    canDownload: false,
  },
]

/** Trạng thái lọc công trình (clone temp.html) */
export const B2B_PROJECTS_STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'building', label: 'Đang thi công' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'paused', label: 'Tạm dừng' },
]

/** Danh sách công trình B2B (clone temp.html) */
export const B2B_PROJECTS_LIST = [
  {
    id: 'SGC-2023-01',
    name: 'Chung cư Sun Grand City',
    location: 'Quận Tây Hồ, Hà Nội',
    type: 'Apartment',
    typeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    startDate: '15/05/2023',
    progress: 65,
    progressClass: 'text-primary',
    progressBarClass: 'bg-primary',
    budget: '4.2B / 6.5B',
    status: 'In Transit',
    statusClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    statusDot: 'bg-blue-500',
  },
  {
    id: 'VOP2-VH-089',
    name: 'KĐT Vinhomes Ocean Park 2',
    location: 'Văn Giang, Hưng Yên',
    type: 'Villa',
    typeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    startDate: '10/01/2024',
    progress: 30,
    progressClass: 'text-amber-500',
    progressBarClass: 'bg-amber-500',
    budget: '1.8B / 12.0B',
    status: 'Installing',
    statusClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    statusDot: 'bg-amber-500',
  },
  {
    id: 'LTM-HN-22',
    name: 'Trung tâm Thương mại Lotte',
    location: 'Lạc Long Quân, Hà Nội',
    type: 'Mall / Office',
    typeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    startDate: '20/11/2022',
    progress: 100,
    progressClass: 'text-green-500',
    progressBarClass: 'bg-green-500',
    budget: '25.4B / 25.0B',
    status: 'Completed',
    statusClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    statusIcon: 'check_circle',
  },
  {
    id: 'TPK-VH-OCP',
    name: 'Tòa nhà VP Technopark',
    location: 'Gia Lâm, Hà Nội',
    type: 'Office',
    typeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    startDate: '05/02/2024',
    progress: 0,
    progressClass: 'text-slate-400',
    progressBarClass: 'bg-slate-300',
    budget: '0 / 8.2B',
    status: 'Pending Quote',
    statusClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    statusDot: 'bg-slate-400',
  },
]

/** Loại hình công trình (form Tạo công trình) */
export const B2B_PROJECT_TYPE_OPTIONS = [
  { value: '', label: 'Chọn loại hình' },
  { value: 'apartment', label: 'Chung cư (Apartment)' },
  { value: 'villa', label: 'Biệt thự (Villa)' },
  { value: 'mall', label: 'TTTM / Văn phòng (Mall/Office)' },
  { value: 'hotel', label: 'Khách sạn (Hotel)' },
  { value: 'other', label: 'Khác' },
]

/** Người phụ trách dự án (form Tạo công trình) */
export const B2B_PROJECT_MANAGER_OPTIONS = [
  { value: '', label: 'Chọn nhân sự' },
  { value: '1', label: 'Nguyễn Văn A - Quản lý kỹ thuật' },
  { value: '2', label: 'Trần Thị B - Giám sát dự án' },
  { value: '3', label: 'Lê Văn C - Trưởng phòng cung ứng' },
]

/** Dự án cho form Tạo báo giá */
export const B2B_QUOTATION_PROJECT_OPTIONS = [
  { value: '', label: '-- Chọn từ danh sách dự án hiện có --' },
  { value: 'p1', label: 'Dự án Vinhomes Grand Park - Phân khu 2' },
  { value: 'p2', label: 'Tòa nhà VP Macvilla - Cầu Giấy' },
  { value: 'p3', label: 'Nhà máy Samsung Thái Nguyên - Giai đoạn 3' },
]

/** Mẫu sản phẩm trong danh sách yêu cầu báo giá (clone temp.html) */
export const B2B_QUOTATION_INITIAL_ITEMS = [
  { id: '1', sku: 'MAC-UTP-C6-305', name: 'Cáp mạng Macvilla UTP Cat6 0.5mm 305m', unitPrice: '1250000', qty: 10, note: '' },
  { id: '2', sku: 'MAC-PWR-2.5-BL', name: 'Dây điện đơn Macvilla 2.5mm xanh dương (Cu/PVC)', unitPrice: '8500', qty: 500, note: '' },
]

/** Tab lịch sử báo giá — khớp `quoteMatchesHistoryTab` trong `src/lib/quotationStatus.js` */
export const B2B_QUOTATION_HISTORY_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pre_customer', label: 'Đang xử lý' },
  { id: 'awaiting_customer', label: 'Chờ bạn phản hồi' },
  { id: 'won', label: 'Đã chốt / Đơn hàng' },
  { id: 'lost', label: 'Từ chối / Hết hạn' },
]

/** Danh sách mã trạng thái lọc — dùng `QUOTATION_HISTORY_STATUS_FILTER_KEYS` từ `src/lib/quotationStatus.js` */
export { QUOTATION_HISTORY_STATUS_FILTER_KEYS as B2B_QUOTATION_HISTORY_STATUS_OPTIONS } from '../lib/quotationStatus'

/** Danh sách báo giá lịch sử (clone temp.html) */
export const B2B_QUOTATION_HISTORY_LIST = [
  { id: 'QTN-2023-085', projectName: 'Chung cư cao cấp SkyGarden Phổ Yên', projectSub: 'CĐT: Macvilla', createdAt: '15/12/2023', total: '1,450,000,000 VNĐ', status: 'Hoàn thành', statusClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { id: 'QTN-2023-072', projectName: 'Hạ tầng điện khu công nghiệp VSIP II', projectSub: 'Thầu phụ: PowerCo', createdAt: '22/10/2023', total: '890,500,000 VNĐ', status: 'Hết hạn', statusClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'QTN-2023-045', projectName: 'Lắp đặt hệ thống cáp tòa nhà Bitexco', projectSub: 'Đối tác: TechLink', createdAt: '05/08/2023', total: '2,100,000,000 VNĐ', status: 'Bị từ chối', statusClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  { id: 'QTN-2023-012', projectName: 'Bảo trì hệ thống điện dự án Vinhomes', projectSub: 'CĐT: Vingroup', createdAt: '12/03/2023', total: '420,000,000 VNĐ', status: 'Hoàn thành', statusClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
]

/** Chi tiết báo giá đã duyệt (clone temp.html #BQ-2023-001) */
export function getB2BQuotationDetail(quotationId) {
  const id = quotationId || 'BQ-2023-001'
  return {
    id,
    projectName: 'Cung cấp vật tư điện công nghiệp - Giai đoạn 1',
    approvedDate: '20/12/2023',
    staff: 'Nguyễn Văn A (Sale Macvilla)',
    depositPercent: 30,
    depositAmount: '148,500,000 VNĐ',
    depositAmountHighlight: '135.000.000 VNĐ',
    depositDeadline: 'Trước 17:00 ngày 25/12/2023',
    validity: '31/12/2023',
    items: [
      { name: 'Cáp điện lực hạ thế CV 2.5mm', spec: 'Mã: MAC-E-001 | Thương hiệu: Macvilla', unit: 'Mét', qty: '1,500', unitPrice: '12,500', total: '18,750,000' },
      { name: 'Ống nhựa xoắn HDPE Cam D50/65', spec: 'Mã: MAC-P-202 | Quy cách: Cuộn 50m', unit: 'Mét', qty: '500', unitPrice: '45,000', total: '22,500,000' },
      { name: 'Trạm biến áp khô 1250kVA', spec: 'Mã: MAC-T-044 | Tiêu chuẩn IEC', unit: 'Bộ', qty: '1', unitPrice: '350,000,000', total: '350,000,000' },
      { name: 'Phụ kiện tủ điện công nghiệp', spec: 'Mã: MAC-A-99 | Trọn bộ lắp đặt', unit: 'Gói', qty: '2', unitPrice: '29,375,000', total: '58,750,000' },
    ],
    financial: {
      subtotal: '450,000,000 VNĐ',
      vat: '45,000,000 VNĐ',
      total: '495,000,000 VNĐ',
      depositLabel: 'Cọc cần thanh toán (30%)',
      deposit: '148,500,000 VNĐ',
      remainingLabel: 'Còn lại (70%)',
      remaining: '346,500,000 VNĐ',
    },
    payment: {
      beneficiary: 'CÔNG TY MACVILLA',
      account: '1234 5678 9999',
      bank: 'Ngân hàng Vietcombank - CN Hà Nội',
      transferSyntax: 'COC BQ2023001 ABCCO',
    },
  }
}

/** Chi tiết đơn hàng B2B (clone temp.html #VH-88291) */
export function getB2BOrderDetail(orderId) {
  const order = {
    id: orderId || 'VH-88291',
    createdAt: '24/10/2023',
    status: 'Đang thực hiện',
    statusClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    project: {
      name: 'Chung cư Blue Sky - Phase II',
      owner: 'Tập đoàn SunGroup',
      address: 'Số 123 Nguyễn Hữu Thọ, Q. Hải Châu, Đà Nẵng',
      contact: 'Nguyễn Văn A - 0905.123.456',
    },
    financial: {
      subtotal: '1,250,000,000 đ',
      discountLabel: 'Chiết khấu B2B (15%):',
      discount: '- 187,500,000 đ',
      vat: '106,250,000 đ',
      total: '1,168,750,000 đ',
    },
    deliveries: [
      {
        id: '1',
        title: 'Đợt 1: Giao hàng phần thô',
        date: 'Ngày giao: 28/10/2023',
        trackingCode: 'VH-LOG-001293',
        status: 'ĐÃ GIAO THÀNH CÔNG',
        statusClass: 'text-emerald-600',
        borderClass: 'border-l-emerald-500',
        headerClass: 'bg-emerald-50/30 dark:bg-emerald-900/10',
        icon: 'check_circle',
        iconClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
        items: [
          { name: 'Thép Việt Úc CB300-V', spec: 'Quy cách: D10, 11.7m', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnn6MxSlW0ictzMpfBT6EiVpBPbzca-lFz-Vk9-cPiHO8TN_YrUTxUH0VUAIm4CEh0Ob98TOmmCTRBY90vZPXhWcNyHxX36_45Q7eqyJedXn5_Ro9G8A08IQjIPnAZf07OdZGegskFgkqobmFg9nxl-rZ5UrKAjUkOOLue-aucV8t7zjMdew1oqgGIEjztm-3Iq2vCWP6XSVUtlYDjj6REjEe_Eb3UxHwvsWe0Wc8_mpVdKMYggTtkCtzI2hcNiCpx6pk_dLgaB-21', qty: '500 Cây', unitPrice: '185,000 đ', total: '92,500,000 đ' },
          { name: 'Xi măng Holcim Đa dụng', spec: 'Bao 50kg', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_qmRhFqc4e6grUOZ4tq2XYjytwmq9IwWJ3CE8i8QUxDWs0xFXKsOWD5Cbw6EI5L-5ZHWpucwhxAxI6durYFxRYtrTg9ZJdBAYSZkcPuL1V956Urz-XUytFUno5DXWDeHq99Yk7C51Hos8v5udX87spH266RwaDRFkw6q8f3rr72KmpR9w53DgSSaxcD05JihHqGKTf-0G3qPWEHVcltid0_QSopTKj42ceWTViYkZGguXv-Mw6AmjB1kiwN2WIfCT-ZWeeRfbypuc', qty: '200 Bao', unitPrice: '89,000 đ', total: '17,800,000 đ' },
        ],
      },
      {
        id: '2',
        title: 'Đợt 2: Hệ thống điện & PCCC',
        date: 'Dự kiến: 05/11/2023',
        trackingCode: 'VH-LOG-001422',
        status: 'ĐANG TRÊN ĐƯỜNG GIAO',
        statusClass: 'text-primary',
        borderClass: 'border-l-primary',
        headerClass: 'bg-primary/5',
        icon: 'local_shipping',
        iconClass: 'bg-primary/10 text-primary',
        items: [
          { name: 'Cáp điện CADIVI 2x4.0', spec: 'Cuộn 100m', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcFftxyTEPSCkeYSn8EjEJsGJyo9SKpcEyruhQHEo5IhjOH2nFnYoErBgHqVlnBvbOOwxwXCFvAufdN4hmNNpZuquXAT8qRnBOfQdBi6IzpNk237tdpBJgaGabhX_85XAsGjAAliV-G0yqnlJBSWL0QaY5NbQgxyiKu1cbtlvdCII_wFBtNrc1ATPi3pu9oE83PucCFPWP9lH5yztemYh2ymjXUNbCd0zaFWQc9CTauJnaqmHD1F_QhmqeF2i_Qd8IMj_vrvA6Dvb4', qty: '15 Cuộn', unitPrice: '1,250,000 đ', total: '18,750,000 đ' },
        ],
      },
      {
        id: '3',
        title: 'Đợt 3: Hoàn thiện & Trang trí',
        date: 'Dự kiến: 20/11/2023',
        trackingCode: 'Chưa cập nhật',
        status: 'ĐANG CHỜ XỬ LÝ',
        statusClass: 'text-slate-400',
        borderClass: 'border-l-slate-300',
        headerClass: '',
        icon: 'schedule',
        iconClass: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
        items: [],
      },
    ],
    deliveryStats: { completed: 1, processing: 2 },
  }
  return order
}

/** KPI công nợ & thanh toán (Payments) */
export const B2B_PAYMENTS_DEBT_KPIS = [
  {
    id: 'limit',
    icon: 'account_balance_wallet',
    iconClass: 'bg-primary/10 text-primary',
    label: 'Hạn mức tín dụng',
    value: '2.500.000.000đ',
    sub: 'Đã sử dụng 1.580.000.000đ (63%)',
  },
  {
    id: 'outstanding',
    icon: 'pending_actions',
    iconClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    label: 'Dư nợ phải trả',
    value: '842.500.000đ',
    sub: '3 chứng từ đang mở',
  },
  {
    id: 'due-soon',
    icon: 'event_upcoming',
    iconClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    label: 'Đến hạn trong 14 ngày',
    value: '215.000.000đ',
    sub: 'Ưu tiên thanh toán',
  },
  {
    id: 'overdue',
    icon: 'warning',
    iconClass: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    label: 'Quá hạn',
    value: '0đ',
    sub: 'Không có khoản quá hạn',
  },
]

/** Bảng công nợ chi tiết */
export const B2B_PAYMENTS_DEBT_ROWS = [
  {
    id: 'd1',
    ref: 'ORD-2024-002',
    type: 'Đơn hàng',
    project: 'Cáp điện lực Miền Nam',
    issuedAt: '11/05/2024',
    dueAt: '25/05/2024',
    total: '42.850.000đ',
    paid: '20.000.000đ',
    remaining: '22.850.000đ',
    status: 'Trong hạn',
    statusClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'd2',
    ref: 'INV-2024-118',
    type: 'Hóa đơn VAT',
    project: 'Sunshine City Sài Gòn',
    issuedAt: '02/05/2024',
    dueAt: '17/05/2024',
    total: '312.400.000đ',
    paid: '100.000.000đ',
    remaining: '212.400.000đ',
    status: 'Sắp đến hạn',
    statusClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    id: 'd3',
    ref: 'DEP-BQ2023',
    type: 'Cọc báo giá',
    project: 'Cung cấp vật tư — GĐ1',
    issuedAt: '20/12/2023',
    dueAt: '25/12/2023',
    total: '148.500.000đ',
    paid: '148.500.000đ',
    remaining: '0đ',
    status: 'Đã tất toán',
    statusClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
]

/** Fallback STK CK khi không đọc được `GET /api/store/b2b/payments/bank-transfer-info` — ưu tiên cấu hình BE `B2bBankTransfer`. */
export const B2B_PAYMENTS_BANK_INFO = {
  beneficiary: 'CÔNG TY MACVILLA',
  account: '1234 5678 9999',
  bank: 'Ngân hàng Vietcombank — CN Hà Nội',
  transferSyntaxPrefix: 'THANH TOAN',
}
