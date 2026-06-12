/**
 * Cart page - mock data
 */
export const CART_STEPS = [
  { step: 1, label: 'Giỏ hàng' },
  { step: 2, label: 'Thông tin thanh toán' },
  { step: 3, label: 'Hoàn tất' },
]

// Ảnh từ trang chính: HOT_SALE (products.js), HERO, SUB_BANNERS (hero.js)
const IMG_BOSCH = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjTps2hcpaZ25QqEb2dyvGsKU07tT5-axWTgociQKByXjR_DMlQr_radBemqLaHbcU8R5YkPO_Fyp879PBl9HUTAXMsjVKgjzlpplqYHHelyT_aHnCyIg5nSVaAlaKVWCn9R7TEIHFXgJz_nZBZVFQqibbPwUffEFXo1CiYSg_QcnRqHu4JCvnpHADybLIBpdx15kNqEWhTAGnoxfjXSc2cbgmeSNHLVovKm1Gsz7LiBqUjVxRgGW9kQrnUXP26KeubkPqXgLS2I_L'
const IMG_TOTO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG6-fB0-JfNg3Kkq33X4owigbqasQT1euWYcvO_dd69fFxWiCUCr7ezpz36bNP-Gi4Lm5rAIcIBpT8SQ7ml_ufhQrzu6ZYyH38UMC2F--0ivuC3m49b9kN-zBIbF4KMPPBRCtanFNAxksMbQrjjlGWkRooVrEWLruJ_a4pfehq3S0Ba5GXzTwIDMlo8FN8rq3VKcny9UmgyH_kR8DMSBJmyegvsuqecV5tfOrnHK89XAuf_LeRvqTIo86eXOYyBdogp7JYuIQQWaIN'
const IMG_HAFELE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6V58CK0IfeyswgqQ5AQS6GttsSAA_DFBYsvusDQU8XEtXPjXDolZN8xcXyzZSoHYc_uqKSkG83t1F1jbPaXvGFCAGfuFztpa_sPcgm6dCKG5rX3PtAuS39HtJQahl1EULFfWXk5lJuiQ5p38uxthJ8hd9Pc8B1cqXEkgKs7ektdyGRVLD6tLYCazZ5r1M_peItWgWgZYqP3ukPIblQqP37FKGwZCBYLqtEUSQE09Edo5jKFFRGBPxiQyojXhH92846k_Me8mOvNe6'
const IMG_ARISTON = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2UE9BDXZ7CAZSmb7LuR7nwP1LwNfHxiVXYOY49dLDkQFmFmbL_VbpQE8PCMssM9VmtmcnV1h5Ymw-FGtA0IeHBKpitW7JK978RFTKMGq_p2O8qFHdO256ahn6tBshZT1ZrPOP3JfPsC5uUeiBS5Mq94MuVWUsdjp9JdLkHd1uI6UCMuzyKXGTcZdYgcciokx_InqoP6RHYnkJ2goeZyNjczQt3QHBVpj_I9N9XyZMlDlonXffIQhMLGJepywqNn0O6HgLR1zIX-LY'
const IMG_INAX = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkSApcq35YTaMiBKVxjReyRinGgKzcRy_mY1RWZmFV-eswwQ_acFxN_l86cSydxrNvW0YBkR42ECQ_pUmDtg2dKtXHIkZfN2RgdQvxfYOgMbP5s_P7ysuImVu1FT-_tpPpPvta8sUygmt7QAbLq1vzZagEjdCp4gCQUKv8ZE3iN8sxywSvcere-VubTWjo_rKUC27koLApqxhayq3soyNwSLkMoc3PUNdNlm5YcgxDiUpY0KuRyZ0Ury1c55HUD0A7hUgCKxwIJTAN'

export const CART_ITEMS = [
  {
    id: 1,
    name: 'Nồi chiên không dầu Magic Eco AC-110',
    image: IMG_BOSCH,
    imageAlt: 'Bếp từ Bosch - thiết bị nhà bếp',
    specs: [
      { icon: 'settings', text: 'Công nghệ Rapid Air thế hệ mới' },
      { icon: 'reduce_capacity', text: 'Dung tích 6.5 Lít' },
    ],
    quantity: 1,
    price: 2490000,
    originalPrice: 2990000,
    discountPercent: 17,
  },
]

export const ORDER_SUMMARY = {
  subtotal: 2490000,
  itemCount: 1,
  shipping: 0,
  shippingLabel: 'Miễn phí',
  couponDiscount: 0,
  total: 2490000,
}

export const FREQUENTLY_BOUGHT = [
  {
    id: 1,
    name: 'Máy xay sinh tố cầm tay Macvilla-01',
    image: IMG_BOSCH,
    imageAlt: 'Bếp từ Bosch - thiết bị nhà bếp',
    price: 450000,
  },
  {
    id: 2,
    name: 'Bộ dao bếp cao cấp 6 món inox 304',
    image: IMG_TOTO,
    imageAlt: 'Bồn cầu TOTO - thiết bị vệ sinh',
    price: 790000,
  },
  {
    id: 3,
    name: 'Nồi nấu chậm sứ cao cấp Bear 1.5L',
    image: IMG_HAFELE,
    imageAlt: 'Máy hút mùi Hafele',
    price: 620000,
  },
  {
    id: 4,
    name: 'Thớt gỗ Teak chống ẩm mốc Macvilla',
    image: IMG_ARISTON,
    imageAlt: 'Bình nóng lạnh Ariston',
    price: 290000,
  },
]
