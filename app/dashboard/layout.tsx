import Sidebar from '@/components/sidebar'
import MobileSidebar from '@/components/mobile-sidebar'
import { getUserProfile } from '@/lib/actions'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
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

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}