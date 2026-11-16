import { SubHeader } from '../components/ui'
import { useSession } from '../lib/session'

export default function Privacy() {
  const { settings } = useSession()
  const S = ({ t, children }: { t: string; children: React.ReactNode }) => (<section className="space-y-1.5"><h2 className="text-lg font-extrabold">{t}</h2><div className="space-y-1.5 text-sm leading-relaxed text-slate-600">{children}</div></section>)
  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <SubHeader eyebrow="Leaders Earning and Skill Board" title="Privacy Policy" />
      <main className="space-y-5 p-5">
        <p className="text-xs text-slate-400">Applies to the Leaders Earning and Skill Board partner app and website. Last updated: 16 November 2026.</p>
        <S t="What we collect">
          <p><b>Partners:</b> name, mobile, email, city, login details, referral code, sales and commission records, payout details (UPI ID or bank account + IFSC) and PAN for KYC/TDS.</p>
          <p><b>Buyers:</b> name, mobile, optional email and, for physical kits, delivery address — only to complete their order.</p>
          <p><b>App activity:</b> orders, notifications read, support tickets.</p>
        </S>
        <S t="What we do NOT access"><p>The app does not use your location, microphone, camera, contacts or run at phone startup. It only needs internet access.</p></S>
        <S t="How we use it"><p>To create your account, attribute sales to your partner code, calculate and pay commission, deliver products, send service notifications, and comply with tax law.</p></S>
        <S t="Sharing">
          <p>We share data only with service providers needed to run the service: hosting/database (Supabase), payment gateway, SMS/email/WhatsApp providers and courier partners. We never sell personal data.</p>
          <p>Partners see buyer names and <b>masked</b> phone numbers for their own orders only. Partners must not share buyer details with anyone else.</p>
        </S>
        <S t="Earnings & payouts"><p>Commission % is shown on every product. Commission is credited when the buyer’s payment is confirmed and reversed if an order is cancelled or refunded. Income comes only from your own product sales — never from recruiting other partners.</p></S>
        <S t="Security & retention"><p>Data is encrypted in transit (HTTPS) and protected by access rules so each partner can see only their own records. We keep records as long as your account is active and as required by tax law.</p></S>
        <S t="Your rights"><p>You can view and edit your details in Profile, and request a copy or deletion of your data by contacting us{settings.support_email ? <> at <b>{settings.support_email}</b></> : ''}.</p></S>
      </main>
    </div>
  )
}
