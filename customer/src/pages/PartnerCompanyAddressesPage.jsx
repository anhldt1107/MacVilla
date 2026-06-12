import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerPaymentsPageHeader } from '../components/partner/PartnerPaymentsPageHeader'
import { StoreAddressBook } from '../components/account/StoreAddressBook'
import { useAuth } from '../contexts/AuthContext'

export function PartnerCompanyAddressesPage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <>
        <PartnerPaymentsPageHeader title="Địa chỉ giao hàng" />
        <section className="p-8 pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <Icon name="login" className="text-lg" />
            Đăng nhập
          </Link>
        </section>
      </>
    )
  }

  return (
    <>
      <PartnerPaymentsPageHeader title="Địa chỉ giao hàng" />

      <section className="p-8 pt-6 max-w-6xl">
        <StoreAddressBook variant="partner" />
      </section>
    </>
  )
}
