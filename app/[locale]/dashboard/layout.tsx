import Sidebar from '@/components/sidebar'
import MobileSidebar from '@/components/mobile-sidebar'
import {getUserProfile} from '@/lib/actions'
import {redirect} from 'next/navigation'

type DashboardLayoutProps = {
  children: React.ReactNode
  params: Promise<{locale: string}>
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const {locale} = await params
  const profile = await getUserProfile()

  if (!profile) {
    redirect(`/${locale}/login`)
  }

  const fullName =
    profile.full_name ||
    profile.fullName ||
    profile.name ||
    'Sistem istifadəçisi'

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileSidebar role={profile.role} fullName={fullName} />

      <div className="flex min-h-screen">
        <Sidebar role={profile.role} fullName={fullName} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}