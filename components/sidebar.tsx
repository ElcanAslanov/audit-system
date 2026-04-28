'use client'

import Link from 'next/link';
import LogoutButton from './logout-button';
import { usePathname } from 'next/navigation';

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  // Linklərin aktivliyini yoxlamaq üçün funksiya
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col h-screen sticky top-0">
      <div className="mb-10">
        <h1 className="text-xl font-bold tracking-tight">Audit Sistem</h1>
        <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">{role}</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <Link href="/dashboard" className={`p-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard') ? 'bg-slate-800' : 'hover:bg-slate-800'}`}>
          Ana Səhifə
        </Link>
        
        {/* Admin üçün İdarəetmə Paneli */}
        {role === 'admin' && (
          <Link href="/dashboard/admin" className={`p-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/admin') ? 'bg-slate-800' : 'hover:bg-slate-800'}`}>
            İdarəetmə Paneli
          </Link>
        )}

        <div className="mt-4 mb-1 px-3 text-xs font-semibold text-slate-500 uppercase">İdarəetmə</div>
        
        {/* Audit Planları */}
        <Link href="/dashboard/plans" className={`p-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/plans') ? 'bg-slate-800' : 'hover:bg-slate-800'}`}>
          Audit Planları
        </Link>
        
        {/* YENİ: Yeni Plan Yaratmaq üçün keçid */}
        <Link href="/dashboard/admin/templates" className={`p-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-200 ${isActive('/dashboard/plans/create') ? 'bg-slate-800 text-white' : ''}`}>
           + Yeni Audit Planı
        </Link>

        {/* Şirkətlər - Yalnız Admin və Rəhbər üçün */}
        {(role === 'admin' || role === 'rehber') && (
          <Link href="/dashboard/companies" className={`p-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/companies') ? 'bg-slate-800' : 'hover:bg-slate-800'}`}>
            Şirkətlər
          </Link>
        )}

        {/* Fəaliyyət bölməsi */}
        <div className="mt-4 mb-1 px-3 text-xs font-semibold text-slate-500 uppercase">Fəaliyyət</div>
        
        <Link href="/dashboard/findings" className={`p-3 rounded-lg transition-colors duration-200 ${isActive('/dashboard/findings') ? 'bg-slate-800' : 'hover:bg-slate-800'}`}>
          Tapıntılar
        </Link>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <LogoutButton />
      </div>
    </aside>
  );
}