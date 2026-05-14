'use client'

import {useEffect, useState} from 'react'
import {Link, usePathname} from '@/i18n/routing'
import {useTranslations} from 'next-intl'
import LanguageSwitcher from './language-switcher'
import LogoutButton from './logout-button'
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  FileQuestion,
  FileSearch,
  Home,
  LayoutDashboard,
  Layers3,
  ListChecks,
  Menu,
  ShieldAlert,
  X,
} from 'lucide-react'

type MobileSidebarProps = {
  role: string
  fullName?: string | null
}

type MenuItem = {
  labelKey: string
  fallbackLabel: string
  href: string
  roles?: string[]
  icon: React.ElementType
  badge?: string
  exact?: boolean
}

const allRoles = [
  'admin',
  'rehber',
  'audit_muavini',
  'auditor',
  'musahideci',
]

const menuItems: MenuItem[] = [
  {
    labelKey: 'dashboard',
    fallbackLabel: 'Dashboard',
    href: '/dashboard',
    roles: allRoles,
    icon: Home,
    exact: true,
  },
  {
    labelKey: 'auditPlans',
    fallbackLabel: 'Audit planları',
    href: '/dashboard/plans',
    roles: allRoles,
    icon: ClipboardCheck,
  },
  {
    labelKey: 'auditQuestions',
    fallbackLabel: 'Audit sualları',
    href: '/dashboard/audit-questions',
    roles: allRoles,
    icon: FileQuestion,
  },
  {
    labelKey: 'notifications',
    fallbackLabel: 'Bildirişlər',
    href: '/dashboard/notifications',
    roles: allRoles,
    icon: Bell,
  },
  {
    labelKey: 'auditCompare',
    fallbackLabel: 'Audit müqayisə',
    href: '/dashboard/compare',
    roles: ['admin', 'rehber', 'muavin', 'audit_muavini', 'musahideci'],
    icon: BarChart3,
  },
  {
    labelKey: 'auditTemplates',
    fallbackLabel: 'Audit şablonları',
    href: '/dashboard/admin/templates',
    roles: ['admin', 'rehber', 'audit_muavini', 'musahideci'],
    icon: ListChecks,
  },
  {
    labelKey: 'admin',
    fallbackLabel: 'Admin',
    href: '/dashboard/admin',
    roles: ['admin'],
    icon: LayoutDashboard,
    badge: 'Admin',
    exact: true,
  },
  {
    labelKey: 'companies',
    fallbackLabel: 'Şirkətlər',
    href: '/dashboard/companies',
    roles: ['admin'],
    icon: Building2,
  },
  {
    labelKey: 'departments',
    fallbackLabel: 'Şöbələr',
    href: '/dashboard/departments',
    roles: ['admin'],
    icon: Layers3,
  },
  {
    labelKey: 'findings',
    fallbackLabel: 'Çatışmazlıqlar',
    href: '/dashboard/findings',
    roles: allRoles,
    icon: ShieldAlert,
  },
]

function canSee(item: MenuItem, role: string) {
  if (!item.roles || item.roles.length === 0) return true
  return item.roles.includes(role)
}

function safeTranslate(t: any, key: string, fallback: string) {
  try {
    return t(key)
  } catch {
    return fallback
  }
}

function roleLabel(role: string, tRoles: any) {
  if (!role) return '-'

  try {
    return tRoles(role)
  } catch {
    return role
  }
}

function isActivePath(pathname: string, item: MenuItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function formatUnreadCount(count: number) {
  if (count > 99) return '99+'
  return String(count)
}

export default function MobileSidebar({role, fullName}: MobileSidebarProps) {
  const pathname = usePathname()
  const tSidebar = useTranslations('sidebar')
  const tRoles = useTranslations('roles')
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
  let alive = true

  const loadUnreadCount = () => {
    fetch('/api/notifications/unread-count')
      .then((res) => res.json())
      .then((data) => {
        if (alive) setUnreadCount(Number(data?.count || 0))
      })
      .catch(() => {
        if (alive) setUnreadCount(0)
      })
  }

  loadUnreadCount()

  window.addEventListener('notifications:changed', loadUnreadCount)

  return () => {
    alive = false
    window.removeEventListener('notifications:changed', loadUnreadCount)
  }
}, [pathname])

  const visibleItems = menuItems.filter((item) => canSee(item, role))
  const displayName = fullName?.trim() || 'Sistem istifadəçisi'

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
                {tSidebar('systemTitle')}
              </p>
              <p className="truncate text-xs font-bold text-slate-500">
                {displayName} • {roleLabel(role, tRoles)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menyunu aç"
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm transition hover:scale-105 hover:bg-slate-800 active:scale-95"
          >
            <Menu size={21} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white ring-2 ring-white">
                {formatUnreadCount(unreadCount)}
              </span>
            )}
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
          className={`relative z-10 flex h-full w-[92%] max-w-sm flex-col overflow-hidden bg-slate-950 text-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute -right-24 bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex h-full min-h-0 flex-col p-4 sm:p-5">
            <div className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-950/40">
                    <FileSearch size={24} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black tracking-tight text-white">
                      {tSidebar('systemTitle')}
                    </h2>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                      {tSidebar('systemSubtitle')}
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
                  {tSidebar('user')}
                </p>

                <p className="mt-1 truncate text-sm font-black text-slate-100">
                  {displayName}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {roleLabel(role, tRoles)}
                </p>
              </div>
            </div>

            <nav className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const active = isActivePath(pathname, item)
                const label = safeTranslate(
                  tSidebar,
                  item.labelKey,
                  item.fallbackLabel
                )
                const showNotificationBadge =
                  item.href === '/dashboard/notifications' && unreadCount > 0

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-200 ${
                      active
                        ? 'bg-white text-slate-950 shadow-lg shadow-blue-950/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute -left-4 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-400 sm:-left-5" />
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
                      {label}
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

                    {showNotificationBadge && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                        {formatUnreadCount(unreadCount)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="relative z-10 mt-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-800 text-sm font-black text-slate-200">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {roleLabel(role, tRoles)}
                  </p>
                </div>
              </div>

              <div className="mb-4 w-full min-w-0">
                <LanguageSwitcher />
              </div>

              <LogoutButton />
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}