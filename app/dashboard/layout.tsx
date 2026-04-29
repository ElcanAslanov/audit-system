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

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileSidebar role={profile.role} />

      <div className="flex min-h-screen">
        <Sidebar role={profile.role} />

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}