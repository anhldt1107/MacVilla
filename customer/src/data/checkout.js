/**
 * Checkout — giá trị `id` gửi lên API như `paymentMethod` (StoreOrderCheckoutDto).
 * @see Documents/guidelineUI/customer/dat-don-thanh-toan.md
 */
export const PAYMENT_METHODS = [
  {
    id: 'PayOS',
    name: 'payment',
    title: 'PayOS',
    description: 'Thanh toán trực tuyến (QR / chuyển khoản qua PayOS)',
    icon: 'qr_code_2',
    defaultChecked: true,
  },
  {
    id: 'COD',
    name: 'payment',
    title: 'Thanh toán khi nhận hàng (COD)',
    description: 'Trả tiền mặt khi shipper giao hàng',
    icon: 'local_shipping',
    defaultChecked: false,
  },
]

export const PROVINCES = [
  'Chọn Tỉnh/Thành phố',
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Khánh Hòa',
  'Lâm Đồng',
  'Bình Dương',
  'Đồng Nai',
]

export const DISTRICTS_PLACEHOLDER = 'Chọn Quận/Huyện'
export const WARDS_PLACEHOLDER = 'Chọn Phường/Xã'

/** Step 3 - sản phẩm gợi ý "Có thể bạn quan tâm" */
export const ORDER_SUCCESS_YOU_MAY_LIKE = [
  {
    id: 1,
    name: 'Vòi sen tăng áp Macvilla-01',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6n8uGnH0etAiXwrfAyc3SUoPiob8VRX-0uKRdwmOHEA2Zv7lPCfx9ugB4LpN1nBxRzG76elzqmOTcjQISBhQJNHU08ps_UqA9yROc5UMxFHxbU6oldy8erKDegZg-JpGDtf5dmO5SKvXRXl8dM2UtwRC50uyptaaVtJJbYSGxbzMIF5bq164FIwAvjLrQrJQTFQaJ4In-KxeveZZ4oKguBuIGzTHtFYMWnpwr9AddCEXiyP0nBkMyLEQGuS3ZfyCeA3UEqsdhS-_8',
    imageAlt: 'Vòi sen cao cấp màu chrome',
    price: 1250000,
  },
  {
    id: 2,
    name: 'Chậu rửa Inox 304',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkEqALYg_q8cSCoJHxWQf5rqLlggoi1mYvlAkjI1TQzjIUSi0PFTQ0tkwI4ZasEoPXdnCwmeaCEG-2KsFKrFeBL8omnoB1fIOCeI_ilAeh4rHSpcVigOF6OC1klIQeGSpOwVlcrvuXwe_yrrPS5YzROcBNn73HZKiOa2PTy1MjByzVY4ory3UTI3FsA3Rrojp-6YzZSxWz4uF4qum85axlw-BmGq9Ug6AF1CTpUbbKpRHUhswDg2sIK-5XynEk2Atv_6NPgfD8NlEz',
    imageAlt: 'Chậu rửa bát inox cao cấp',
    price: 2400000,
  },
  {
    id: 3,
    name: 'Bồn cầu thông minh S1',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARw4hL4GSfLL6w9SQ6Nw13bUWTzRJyyGgsgEN6_SuC_Iv7Bn_B3aMcPJnAORKTxQKUCaTc1JXp87lfznrJ_rt7jZ2bpAAkmSUdfcgrx5TvCnysl5644KXgGGjE49zK0GHChx1f5wODbmcmEQVotOBvT9jRC48QtFDbQPQAIj3ly_rfJ0qOVv5ZNVZShEbR8Ak0rzMUBHZjj0xNkwzCr9Eco_EOpMLHJo5dF8u6H4Gr9N3ycGvdrZIM4mpz3_Fp-TyK3jHdcj2tQEh8',
    imageAlt: 'Bồn cầu thông minh hiện đại',
    price: 8900000,
  },
  {
    id: 4,
    name: 'Bếp từ đôi hồng ngoại',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWOzpK4tp8p4dka-oc4B_WZKgGZj-ErDWEkdKCpAhG9DJlzwsyStnIKjwYXo8R5a1YFDvU0wqOyA_1ESy0xZ2ZvijAHI9obCtlIwZ05SnJ1paJzWra2n2lySBfLQimsxhTN_qFQp9AGaq5iP42olNnVLqVdbevjO1v5Z_NslEmLrZg7MULqf_Zoozo2f5TfefcsTl_-f3NUyHrTswj7x42qZLcJYXNTcQQJ0Cm74jXru3b16IJq9WWBtuRPQ42aJ59SodyH8P1kbNm',
    imageAlt: 'Bếp từ âm sang trọng',
    price: 5600000,
  },
]

export const CHECKOUT_TRUST = [
  {
    icon: 'verified_user',
    title: 'Sản phẩm chính hãng 100%',
    desc: 'Cam kết bồi thường 200% nếu phát hiện hàng giả.',
  },
  {
    icon: 'shield_lock',
    title: 'Thanh toán bảo mật',
    desc: 'Thông tin giao dịch được mã hóa chuẩn quốc tế SSL.',
  },
  {
    icon: 'support_agent',
    title: 'Hỗ trợ kỹ thuật 24/7',
    desc: 'Hotline: 1900 xxxx (Miễn phí cuộc gọi)',
  },
]
