'use client'

import Link from 'next/link'
import LogoutButton from './logout-button'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  Home,
  LayoutDashboard,
  Layers3,
  ListChecks,
  ShieldAlert,
} from 'lucide-react'

type SidebarProps = {
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

const mainItems: MenuItem[] = [
  {
    label: 'Ana Səhifə',
    href: '/dashboard',
    roles: allRoles,
    icon: Home,
  },
]

const managementItems: MenuItem[] = [
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
    label: 'İdarəetmə',
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
  label: 'Departamentlər',
  href: '/dashboard/departments',
  roles: ['admin'],
  icon: Layers3,
},
]

const activityItems: MenuItem[] = [
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

function SectionTitle({
  children,
  collapsed,
}: {
  children: React.ReactNode
  collapsed: boolean
}) {
  if (collapsed) {
    return <div className="my-5 h-px w-full bg-slate-800" />
  }

  return (
    <div className="mb-2 mt-6 flex items-center gap-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
      <span className="h-px flex-1 bg-slate-800" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-slate-800" />
    </div>
  )
}

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: MenuItem
  pathname: string
  collapsed: boolean
}) {
  const Icon = item.icon

const isDashboardRoot = item.href === '/dashboard'

let active = false

if (isDashboardRoot) {
  active = pathname === '/dashboard'
} else if (item.href === '/dashboard/admin') {
  active = pathname === '/dashboard/admin'
} else {
  active = pathname === item.href || pathname.startsWith(`${item.href}/`)
}

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group relative flex w-full items-center rounded-2xl text-sm font-bold transition-all duration-300 ${
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3'
      } ${
        active
          ? 'bg-white text-slate-950 shadow-lg shadow-blue-950/20'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {active && (
        <span className="absolute -left-5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-400" />
      )}

      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
          active
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
        }`}
      >
        <Icon size={18} />
      </span>

      <span
        className={`min-w-0 flex-1 truncate transition-all duration-300 ${
          collapsed
            ? 'w-0 translate-x-2 overflow-hidden opacity-0'
            : 'w-auto translate-x-0 opacity-100'
        }`}
      >
        {item.label}
      </span>

      {!collapsed && item.badge && (
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

      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xl group-hover:block">
          {item.label}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('audit-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem('audit-sidebar-collapsed', String(collapsed))
  }, [collapsed, mounted])

  const visibleMainItems = mainItems.filter((item) => canSee(item, role))
  const visibleManagementItems = managementItems.filter((item) =>
    canSee(item, role)
  )
  const visibleActivityItems = activityItems.filter((item) => canSee(item, role))

  return (
    <aside
      className={`hidden h-screen shrink-0 overflow-visible bg-slate-950 text-white transition-all duration-500 ease-in-out lg:sticky lg:top-0 lg:flex lg:flex-col ${
        collapsed ? 'w-24' : 'w-72'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col p-5">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -right-4 top-7 z-50 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:bg-slate-50"
          title={collapsed ? 'Sidebar aç' : 'Sidebar bağla'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div
          className={`mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur transition-all duration-500 ${
            collapsed ? 'p-3' : 'p-4'
          }`}
        >
          <div
            className={`flex items-center transition-all duration-500 ${
              collapsed ? 'justify-center' : 'gap-3'
            }`}
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-950/40">
              <FileSearch size={24} />
            </div>

            <div
              className={`min-w-0 transition-all duration-500 ${
                collapsed
                  ? 'w-0 translate-x-2 overflow-hidden opacity-0'
                  : 'w-auto translate-x-0 opacity-100'
              }`}
            >
              <h1 className="truncate text-xl font-black tracking-tight text-white">
                Audit Sistemi
              </h1>
              <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                Risk və nəzarət paneli
              </p>
            </div>
          </div>

          {!collapsed && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Rol
              </p>
              <p className="mt-1 text-sm font-bold text-slate-100">
                {roleLabel(role)}
              </p>
            </div>
          )}
        </div>

        <nav className="relative z-10 flex flex-1 flex-col overflow-y-auto overflow-x-visible pr-1 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          <div className="space-y-2">
            {visibleMainItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </div>

          {visibleManagementItems.length > 0 && (
            <>
              <SectionTitle collapsed={collapsed}>İdarəetmə</SectionTitle>
              <div className="space-y-2">
                {visibleManagementItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </>
          )}

          {visibleActivityItems.length > 0 && (
            <>
              <SectionTitle collapsed={collapsed}>Fəaliyyət</SectionTitle>
              <div className="space-y-2">
                {visibleActivityItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        <div
          className={`relative z-10 mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur transition-all duration-500 ${
            collapsed ? 'p-3' : 'p-4'
          }`}
        >
          <div
            className={`mb-4 flex items-center transition-all duration-500 ${
              collapsed ? 'justify-center' : 'gap-3'
            }`}
          >
          
            
          </div>

         {!collapsed ? (
  <LogoutButton />
) : (
  <div className="flex justify-center">
    <LogoutButton compact />
  </div>
)}
        </div>
      </div>
    </aside>
  )
}