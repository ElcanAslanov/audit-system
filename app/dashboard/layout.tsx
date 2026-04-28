// app/dashboard/layout.tsx
import { getUserProfile } from '@/lib/actions';
import Sidebar from '@/components/sidebar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile();

  // Əgər profil yoxdursa və ya istifadəçi yoxdursa, loginə göndər
  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - bura profilin rolunu göndəririk */}
      <Sidebar role={profile.role} />
      
      {/* Əsas məzmun */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}