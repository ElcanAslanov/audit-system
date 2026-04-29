'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './logout-button'
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileSearch,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  ShieldAlert,
  X,
} from 'lucide-react'

type MobileSidebarProps = {
  role: string
}

type MenuItem = {
  label: string
  href: string
  roles?: string[]
  icon: React.ElementType
  badge?: string
}

const allRoles = ['admin', 'rehber', 'muavin', 'audit_muavini', 'auditor']

const menuItems: MenuItem[] = [
  {
    label: 'Ana Səhifə',
    href: '/dashboard',
    roles: allRoles,
    icon: Home,
  },
  {
    label: 'Audit Planları',
    href: '/dashboard/plans',
    roles: allRoles,
    icon: ClipboardCheck,
  },
  {
    label: 'Audit Müqayisəsi',
    href: '/dashboard/compare',
    roles: ['admin', 'rehber', 'muavin', 'audit_muavini'],
    icon: BarChart3,
  },
  {
    label: 'Audit Şablonları',
    href: '/dashboard/admin/templates',
    roles: ['admin', 'rehber', 'audit_muavini'],
    icon: ListChecks,
  },
  {
    label: 'İdarəetmə Paneli',
    href: '/dashboard/admin',
    roles: ['admin'],
    icon: LayoutDashboard,
    badge: 'Admin',
  },
  {
    label: 'Şirkətlər',
    href: '/dashboard/companies',
    roles: ['admin'],
    icon: Building2,
  },
  {
    label: 'Tapıntılar',
    href: '/dashboard/findings',
    roles: allRoles,
    icon: ShieldAlert,
  },
]

function canSee(item: MenuItem, role: string) {
  if (!item.roles || item.roles.length === 0) return true
  return item.roles.includes(role)
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Administrator'
  if (role === 'rehber') return 'Rəhbər'
  if (role === 'muavin') return 'Müavin'
  if (role === 'audit_muavini') return 'Audit müavini'
  if (role === 'auditor') return 'Auditor'
  return role || '-'
}

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function MobileSidebar({ role }: MobileSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const visibleItems = menuItems.filter((item) => canSee(item, role))

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-200">
              <FileSearch size={22} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">
                Audit Sistemi
              </p>
              <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">
                {roleLabel(role)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menyunu aç"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm transition hover:scale-105 hover:bg-slate-800 active:scale-95"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <button
          type="button"
          aria-label="Menyu arxa fonunu bağla"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          className={`relative z-10 flex h-full w-[88%] max-w-sm flex-col overflow-hidden bg-slate-950 text-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute -right-24 bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex h-full flex-col p-5">
            <div className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-950/40">
                    <FileSearch size={24} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black tracking-tight text-white">
                      Audit Sistemi
                    </h2>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                      Risk və nəzarət paneli
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Menyunu bağla"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:rotate-90 hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Rol
                </p>
                <p className="mt-1 text-sm font-bold text-slate-100">
                  {roleLabel(role)}
                </p>
              </div>
            </div>

            <nav className="relative z-10 flex flex-1 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const active = isActivePath(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200 ${
                      active
                        ? 'bg-white text-slate-950 shadow-lg shadow-blue-950/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute -left-5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-400" />
                    )}

                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          active
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-500/10 text-blue-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="relative z-10 mt-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-800 text-sm font-black text-slate-200">
                  {roleLabel(role).slice(0, 1)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    Sistem istifadəçisi
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {roleLabel(role)}
                  </p>
                </div>
              </div>

             <LogoutButton />
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}