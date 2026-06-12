/**
 * Product listing page - ảnh từ trang chính (Hot Sale)
 */
const IMG_BOSCH = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjTps2hcpaZ25QqEb2dyvGsKU07tT5-axWTgociQKByXjR_DMlQr_radBemqLaHbcU8R5YkPO_Fyp879PBl9HUTAXMsjVKgjzlpplqYHHelyT_aHnCyIg5nSVaAlaKVWCn9R7TEIHFXgJz_nZBZVFQqibbPwUffEFXo1CiYSg_QcnRqHu4JCvnpHADybLIBpdx15kNqEWhTAGnoxfjXSc2cbgmeSNHLVovKm1Gsz7LiBqUjVxRgGW9kQrnUXP26KeubkPqXgLS2I_L'
const IMG_TOTO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG6-fB0-JfNg3Kkq33X4owigbqasQT1euWYcvO_dd69fFxWiCUCr7ezpz36bNP-Gi4Lm5rAIcIBpT8SQ7ml_ufhQrzu6ZYyH38UMC2F--0ivuC3m49b9kN-zBIbF4KMPPBRCtanFNAxksMbQrjjlGWkRooVrEWLruJ_a4pfehq3S0Ba5GXzTwIDMlo8FN8rq3VKcny9UmgyH_kR8DMSBJmyegvsuqecV5tfOrnHK89XAuf_LeRvqTIo86eXOYyBdogp7JYuIQQWaIN'
const IMG_HAFELE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6V58CK0IfeyswgqQ5AQS6GttsSAA_DFBYsvusDQU8XEtXPjXDolZN8xcXyzZSoHYc_uqKSkG83t1F1jbPaXvGFCAGfuFztpa_sPcgm6dCKG5rX3PtAuS39HtJQahl1EULFfWXk5lJuiQ5p38uxthJ8hd9Pc8B1cqXEkgKs7ektdyGRVLD6tLYCazZ5r1M_peItWgWgZYqP3ukPIblQqP37FKGwZCBYLqtEUSQE09Edo5jKFFRGBPxiQyojXhH92846k_Me8mOvNe6'
const IMG_ARISTON = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2UE9BDXZ7CAZSmb7LuR7nwP1LwNfHxiVXYOY49dLDkQFmFmbL_VbpQE8PCMssM9VmtmcnV1h5Ymw-FGtA0IeHBKpitW7JK978RFTKMGq_p2O8qFHdO256ahn6tBshZT1ZrPOP3JfPsC5uUeiBS5Mq94MuVWUsdjp9JdLkHd1uI6UCMuzyKXGTcZdYgcciokx_InqoP6RHYnkJ2goeZyNjczQt3QHBVpj_I9N9XyZMlDlonXffIQhMLGJepywqNn0O6HgLR1zIX-LY'
const IMG_INAX = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkSApcq35YTaMiBKVxjReyRinGgKzcRy_mY1RWZmFV-eswwQ_acFxN_l86cSydxrNvW0YBkR42ECQ_pUmDtg2dKtXHIkZfN2RgdQvxfYOgMbP5s_P7ysuImVu1FT-_tpPpPvta8sUygmt7QAbLq1vzZagEjdCp4gCQUKv8ZE3iN8sxywSvcere-VubTWjo_rKUC27koLApqxhayq3soyNwSLkMoc3PUNdNlm5YcgxDiUpY0KuRyZ0Ury1c55HUD0A7hUgCKxwIJTAN'
const IMG_HERO = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCugUKb3q9eqjgnHI-kiug4tLyRMROp9ybvu6ZacarB4ZeBagYZBs-iWhB32qXa3R3Yn5b7uk3Y2DYCw6eZQPpmJAO_7oz-7iA8wZR2g61LOjqTXiZwaSPJnY5lVNu5EYLu9dle7IrIB6vEVi3iZA_aWytuKyv0McnZ4lrdLLYKJrXuDPlUMGVbgq-4VNKlYj1_6bulMqNce0S9frEohUa2YN5dQLXeE1Iu6qSEbxdw3oyBFfw0GZ1a7y4nu18f7bhks6gmakVe7uAT'

export const LISTING_PRODUCTS = [
  {
    id: 1,
    name: 'Tủ lạnh thông minh Smart-Cool X1 nhiều cánh',
    tag: 'Macvilla Cao cấp',
    image: IMG_BOSCH,
    imageAlt: 'Bếp từ Bosch - thiết bị nhà bếp',
    price: 2499,
    originalPrice: 2999,
    badges: ['Bảo hành chính hãng'],
  },
  {
    id: 2,
    name: 'Bếp từ Macvilla Pro-Cook 4 vùng kính',
    tag: 'Bán chạy',
    image: IMG_TOTO,
    imageAlt: 'Bồn cầu TOTO - thiết bị vệ sinh',
    price: 849,
    originalPrice: null,
    badges: ['Bảo hành chính hãng'],
  },
  {
    id: 3,
    name: 'Lò nướng đối lưu hơi nước Smart-Steam Pro V9',
    tag: 'Hàng mới',
    image: IMG_HAFELE,
    imageAlt: 'Máy hút mùi Hafele',
    price: 1299,
    originalPrice: 1599,
    badges: ['Bảo hành chính hãng', 'Tiết kiệm điện A+++'],
  },
  {
    id: 4,
    name: 'Máy rửa bát SilentWash G7 âm tủ thân thiện môi trường',
    tag: 'Macvilla',
    image: IMG_ARISTON,
    imageAlt: 'Bình nóng lạnh Ariston',
    price: 729,
    originalPrice: null,
    badges: ['Bảo hành chính hãng'],
  },
  {
    id: 5,
    name: 'Máy hút mùi treo tường ClearAir inox',
    tag: 'Ưu đãi đặc biệt',
    image: IMG_INAX,
    imageAlt: 'Vòi sen Inax',
    price: 399,
    originalPrice: 499,
    badges: ['Bảo hành chính hãng'],
  },
  {
    id: 6,
    name: 'Lò vi sóng đa chức năng Quick-Heat 1200W',
    tag: 'Macvilla',
    image: IMG_HERO,
    imageAlt: 'Combo bếp Bosch - trang chính',
    price: 219,
    originalPrice: null,
    badges: ['Bảo hành chính hãng'],
  },
]

export const SORT_OPTIONS = [
  { id: 'bestselling', label: 'Bán chạy nhất' },
  { id: 'newest', label: 'Mới nhất' },
  { id: 'price-asc', label: 'Giá thấp đến cao' },
]

export const BREADCRUMBS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Thiết bị nhà bếp', href: '/products' },
  { label: 'Bộ sưu tập Macvilla', href: null },
]

export const PAGINATION = {
  current: 1,
  total: 8,
  totalProducts: 24,
}
