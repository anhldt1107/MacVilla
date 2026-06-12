/**
 * Product detail page - mock data (single product)
 */
export const PRODUCT_DETAIL_BREADCRUMBS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Thiết bị nhà bếp', href: '/products' },
  { label: 'Máy rửa bát', href: '/products' },
  { label: 'Bosch Series 6 SMS6ZCI49E', href: null },
]

export const PRODUCT_DETAIL = {
  id: 1,
  name: 'Máy rửa bát Bosch Series 6 SMS6ZCI49E đứng - Sấy khô Zeolith',
  shortName: 'Bosch Series 6 SMS6ZCI49E',
  rating: 4.8,
  reviewCount: 124,
  inStock: true,
  price: 1249,
  originalPrice: 1599,
  discountPercent: 22,
  // Ảnh từ trang chính: hot sale (Bếp Bosch, TOTO, Hafele, Ariston)
  mainImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAjTps2hcpaZ25QqEb2dyvGsKU07tT5-axWTgociQKByXjR_DMlQr_radBemqLaHbcU8R5YkPO_Fyp879PBl9HUTAXMsjVKgjzlpplqYHHelyT_aHnCyIg5nSVaAlaKVWCn9R7TEIHFXgJz_nZBZVFQqibbPwUffEFXo1CiYSg_QcnRqHu4JCvnpHADybLIBpdx15kNqEWhTAGnoxfjXSc2cbgmeSNHLVovKm1Gsz7LiBqUjVxRgGW9kQrnUXP26KeubkPqXgLS2I_L',
  mainImageAlt: 'Bếp từ Bosch - thiết bị nhà bếp',
  thumbnails: [
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjTps2hcpaZ25QqEb2dyvGsKU07tT5-axWTgociQKByXjR_DMlQr_radBemqLaHbcU8R5YkPO_Fyp879PBl9HUTAXMsjVKgjzlpplqYHHelyT_aHnCyIg5nSVaAlaKVWCn9R7TEIHFXgJz_nZBZVFQqibbPwUffEFXo1CiYSg_QcnRqHu4JCvnpHADybLIBpdx15kNqEWhTAGnoxfjXSc2cbgmeSNHLVovKm1Gsz7LiBqUjVxRgGW9kQrnUXP26KeubkPqXgLS2I_L',
      alt: 'Bếp từ Bosch',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG6-fB0-JfNg3Kkq33X4owigbqasQT1euWYcvO_dd69fFxWiCUCr7ezpz36bNP-Gi4Lm5rAIcIBpT8SQ7ml_ufhQrzu6ZYyH38UMC2F--0ivuC3m49b9kN-zBIbF4KMPPBRCtanFNAxksMbQrjjlGWkRooVrEWLruJ_a4pfehq3S0Ba5GXzTwIDMlo8FN8rq3VKcny9UmgyH_kR8DMSBJmyegvsuqecV5tfOrnHK89XAuf_LeRvqTIo86eXOYyBdogp7JYuIQQWaIN',
      alt: 'Bồn cầu TOTO',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6V58CK0IfeyswgqQ5AQS6GttsSAA_DFBYsvusDQU8XEtXPjXDolZN8xcXyzZSoHYc_uqKSkG83t1F1jbPaXvGFCAGfuFztpa_sPcgm6dCKG5rX3PtAuS39HtJQahl1EULFfWXk5lJuiQ5p38uxthJ8hd9Pc8B1cqXEkgKs7ektdyGRVLD6tLYCazZ5r1M_peItWgWgZYqP3ukPIblQqP37FKGwZCBYLqtEUSQE09Edo5jKFFRGBPxiQyojXhH92846k_Me8mOvNe6',
      alt: 'Máy hút mùi Hafele',
    },
    {
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2UE9BDXZ7CAZSmb7LuR7nwP1LwNfHxiVXYOY49dLDkQFmFmbL_VbpQE8PCMssM9VmtmcnV1h5Ymw-FGtA0IeHBKpitW7JK978RFTKMGq_p2O8qFHdO256ahn6tBshZT1ZrPOP3JfPsC5uUeiBS5Mq94MuVWUsdjp9JdLkHd1uI6UCMuzyKXGTcZdYgcciokx_InqoP6RHYnkJ2goeZyNjczQt3QHBVpj_I9N9XyZMlDlonXffIQhMLGJepywqNn0O6HgLR1zIX-LY',
      alt: 'Bình nóng lạnh Ariston',
    },
  ],
  moreThumbsCount: 12,
  highlights: [
    { icon: 'verified_user', title: 'Nhà phân phối chính hãng', subtitle: '100% Bosch chính hãng' },
    { icon: 'published_with_changes', title: 'Bảo hành 1 đổi 1', subtitle: 'Đổi trong 30 ngày' },
  ],
  comboOffers: [
    {
      id: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkSApcq35YTaMiBKVxjReyRinGgKzcRy_mY1RWZmFV-eswwQ_acFxN_l86cSydxrNvW0YBkR42ECQ_pUmDtg2dKtXHIkZfN2RgdQvxfYOgMbP5s_P7ysuImVu1FT-_tpPpPvta8sUygmt7QAbLq1vzZagEjdCp4gCQUKv8ZE3iN8sxywSvcere-VubTWjo_rKUC27koLApqxhayq3soyNwSLkMoc3PUNdNlm5YcgxDiUpY0KuRyZ0Ury1c55HUD0A7hUgCKxwIJTAN',
      imageAlt: 'Vòi sen Inax - thiết bị vệ sinh',
      title: 'Viên rửa bát Finish Quantum Ultimate (80 viên)',
      subtitle: 'Tiết kiệm 15$ khi mua kèm',
      addPrice: 35,
    },
    {
      id: 2,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADNsYpVucW5iTSmhLy04MJkAzcaLjMqQGn-lLtGk3w5C6XgaeLBaJOOViw-mnp58SZQ0VeiyF3uo5a6RY3l691AjIyDBaGpJbSwRZB1yL2sV1ozSjaYYGWNHPvT-p3kQq__UKb8CVvF6xtSDeA-ichKAIh0ucZPqytizHGj3kbJU_E-T8pUdJ6e54koHh4qgwDR8GWsr1rCZxu0SbAM46OJNmBBKQapw5Z8XaAeyvKaqi1aYPljOv-g4xKPxd7j0w5jt3jASyJrmDP',
      imageAlt: 'Thiết bị TOTO',
      title: 'Muối rửa bát Finish Special (1.5kg)',
      subtitle: 'Tiết kiệm 5$ khi mua kèm',
      addPrice: 12,
    },
  ],
  // Ảnh review dùng từ trang chính (hero - không dùng ảnh con người)
  reviews: [
    {
      id: 1,
      author: 'Nguyễn Văn A.',
      rating: 5,
      text: '"Rất êm, công nghệ sấy Zeolith giúp hộp nhựa khô ráo. Đắt nhưng xứng đáng."',
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCugUKb3q9eqjgnHI-kiug4tLyRMROp9ybvu6ZacarB4ZeBagYZBs-iWhB32qXa3R3Yn5b7uk3Y2DYCw6eZQPpmJAO_7oz-7iA8wZR2g61LOjqTXiZwaSPJnY5lVNu5EYLu9dle7IrIB6vEVi3iZA_aWytuKyv0McnZ4lrdLLYKJrXuDPlUMGVbgq-4VNKlYj1_6bulMqNce0S9frEohUa2YN5dQLXeE1Iu6qSEbxdw3oyBFfw0GZ1a7y4nu18f7bhks6gmakVe7uAT',
      ],
    },
    {
      id: 2,
      author: 'Trần Thị B.',
      rating: 4,
      text: '"Ứng dụng HomeConnect tiện lợi, tôi nhận thông báo trên điện thoại khi máy chạy xong."',
      images: [],
    },
  ],
  qa: [
    {
      question: 'Có lắp âm tủ bếp được không?',
      answer:
        'Có. Đây là máy đứng nhưng có thể tháo nắp trên để lắp dưới quầy bếp tiêu chuẩn.',
    },
  ],
  specs: [
    { label: 'Dòng', value: 'Series 6' },
    { label: 'Dung tích', value: '14 bộ đồ ăn' },
    { label: 'Độ ồn', value: '42 dB' },
    { label: 'Công nghệ sấy', value: 'Zeolith®' },
    { label: 'Lượng nước', value: '9.5L / chu kỳ' },
    { label: 'Kích thước', value: '84.5 x 60 x 60 cm' },
    { label: 'Trọng lượng', value: '54.3 kg' },
  ],
  services: [
    { icon: 'local_shipping', iconColor: 'text-green-600', title: 'Giao hàng nhanh', subtitle: 'Miễn phí trong bán kính 10km' },
    { icon: 'handyman', iconColor: 'text-blue-600', title: 'Lắp đặt miễn phí', subtitle: 'Bao gồm nối ống nước cơ bản' },
    { icon: 'support_agent', iconColor: 'text-purple-600', title: 'Hỗ trợ kỹ thuật 24/7', subtitle: 'Đường dây nóng thiết bị cao cấp' },
  ],
}
