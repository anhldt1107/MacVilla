import { RegisterPartnerAside } from '../components/registerPartner/RegisterPartnerAside'
import { RegisterPartnerForm } from '../components/registerPartner/RegisterPartnerForm'

export function RegisterPartnerPage() {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <RegisterPartnerAside />
      <RegisterPartnerForm />
    </div>
  )
}
