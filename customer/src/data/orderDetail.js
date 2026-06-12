/**
 * Chi tiết đơn hàng - mock cho trang /account/orders/:orderId
 */
export const ORDER_DETAIL_SHIPPING_STEPS = [
  { icon: 'check_circle', label: 'Đã đặt hàng', time: '24/10/2023 10:00', done: true },
  { icon: 'thumb_up', label: 'Đã xác nhận', time: '24/10/2023 14:30', done: true },
  { icon: 'local_shipping', label: 'Đang giao', time: '25/10/2023 08:00', done: true },
  { icon: 'package_2', label: 'Đã giao', time: 'Dự kiến 27/10/2023', done: false },
]

export function getOrderDetail(orderId) {
  // Mock: trả về chi tiết đơn MV-882910 hoặc orderId
  const id = orderId || 'MV-882910'
  return {
    id: id,
    orderDate: '24/10/2023',
    orderTime: '10:00 AM',
    products: [
      {
        name: 'Cáp điện công nghiệp CV-2.5',
        sku: 'VH-C25-RD',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1TSRVVUu4uTavWr3duBdIuXAjVPHf8QSbjedUvfp-08TCdoGMPmnSJ1oZHskh1HOUbO8jyf1FQDTyIMKwDNoZYbS2cSTDq7LwCMLXQk7ldHf-WV-nHQo9JLRs21uUGUp_Ecovo8Zxuv2l8rGe6C6zWZY-0FsJtmAc46UG_QaYXHac0QXUlWdu-ncgoPgVN9sZiWPTYHjdsdTf6sv4GKqJatcJ8Bs0ZMNNgUp1jc12G2shOM2j3aH5nC_SW1k1M6s7PvqdbBE8frsr',
        imageAlt: 'Cáp điện công nghiệp',
        unitPrice: 1200000,
        quantity: 2,
        subtotal: 2400000,
      },
      {
        name: 'Đầu nối cáp đồng nguyên chất',
        sku: 'VH-ACC-01',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVxPLD94P6JYbi1chJ6T9Ut3cnptWtn4OyZF2LnQySqeIRecEp5092Dlj6b3yEnKO4qcfjYgCD62gNb4fIX2D1NWYfgD40QHAQ_6xhx0_yK3Pk3vO2MZRW1PkvuDRnA7MUKe9AXervP6rKwycDJqEyQCHXjZphrtI1meZEp0U7sZv8Ji_iVxa8qH26BCq8DGk0SWtmkzlDRDRrE2q7W1WKKEJeAUNB2thAAR00NLbAICEFZQlUOfPUyMCa70_KhQVCHTyGOjULc6Nb',
        imageAlt: 'Đầu nối cáp đồng',
        unitPrice: 5000,
        quantity: 100,
        subtotal: 500000,
      },
    ],
    shipping: {
      recipient: 'Nguyễn Văn An',
      phone: '0901 234 567',
      address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    },
    payment: {
      method: 'PayOS',
      icon: 'qr_code_2',
      status: 'Đã thanh toán thành công',
      statusSuccess: true,
    },
    summary: {
      subtotal: 2900000,
      shippingFee: 50000,
      vat: 295000,
      total: 3245000,
    },
    progressPercent: 75,
  }
}
