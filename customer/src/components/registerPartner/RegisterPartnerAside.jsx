import { Icon } from '../ui/Icon'
import { PARTNER_BENEFITS, PARTNER_HERO_IMAGE } from './constants'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../lib/brand'
import './registerPartnerAside.css'

export function RegisterPartnerAside() {
  return (
    <div className="rpb-aside">
      <div className="rpb-aside-bg">
        <div className="rpb-aside-bg-overlay" />
        <div
          className="rpb-aside-bg-image"
          style={{ backgroundImage: `url("${PARTNER_HERO_IMAGE}")` }}
          role="img"
          aria-label="Kiến trúc văn phòng cao cấp"
        />
      </div>
      <div className="rpb-aside-content">
        <div className="rpb-aside-brand">
          <img
            src={BRAND_LOGO_SRC}
            alt=""
            className="rpb-aside-brand-logo max-h-11 w-auto object-contain drop-shadow-md"
          />
        </div>
        <div className="rpb-aside-headline">
          <h1 className="rpb-aside-h1">
            Hợp tác phát triển bền vững cùng {BRAND_NAME}
          </h1>
          <p className="rpb-aside-lead">
            Gia nhập mạng lưới đối tác chiến lược để nhận các giải pháp nhôm kính và
            nội thất cao cấp hàng đầu Việt Nam.
          </p>
        </div>
      </div>
      <div className="rpb-aside-benefits">
        {PARTNER_BENEFITS.map((item) => (
          <div key={item.title} className="rpb-aside-benefit-card">
            <div className="rpb-aside-benefit-icon-wrap">
              <Icon name={item.icon} className="text-xl" />
            </div>
            <div>
              <h3 className="rpb-aside-benefit-title">{item.title}</h3>
              <p className="rpb-aside-benefit-desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rpb-aside-footer">
        <p className="rpb-aside-footer-copy">
          © 2026 {BRAND_NAME}. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </div>
  )
}
