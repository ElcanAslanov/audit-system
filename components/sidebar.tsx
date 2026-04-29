'use client'

import Link from 'next/link'
import LogoutButton from './logout-button'
import { usePathname } from 'next/navigation'

type SidebarProps = {
  role: string
}

type MenuItem = {
  label: string
  href: string
  roles?: string[]
}

const allRoles = ['admin', 'rehber', 'muavin', 'audit_muavini', 'auditor']

const mainItems: MenuItem[] = [
  {
    label: 'Ana Səhifə',
    href: '/dashboard',
    roles: allRoles,
  },
]

const managementItems: MenuItem[] = [
  {
    label: 'Audit Planları',
    href: '/dashboard/plans',
    roles: allRoles,
  },
  {
    label: 'Audit Müqayisəsi',
    href: '/dashboard/compare',
    roles: ['admin', 'rehber', 'muavin', 'audit_muavini'],
  },
  {
    label: 'Audit Şablonları',
    href: '/dashboard/admin/templates',
    roles: ['admin', 'rehber', 'audit_muavini'],
  },
  {
    label: 'İdarəetmə Paneli',
    href: '/dashboard/admin',
    roles: ['admin'],
  },
  {
    label: 'Şirkətlər',
    href: '/dashboard/companies',
    roles: ['admin', 'rehber'],
  },
]

const activityItems: MenuItem[] = [
  {
    label: 'Tapıntılar',
    href: '/dashboard/findings',
    roles: allRoles,
  },
]

function canSee(item: MenuItem, role: string) {
  if (!item.roles || item.roles.length === 0) return true
  return item.roles.includes(role)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </div>
  )
}

function SidebarLink({
  item,
  pathname,
}: {
  item: MenuItem
  pathname: string
}) {
  const isDashboardRoot = item.href === '/dashboard'
  const active = isDashboardRoot
    ? pathname === '/dashboard'
    : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <Link
      href={item.href}
      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {item.label}
    </Link>
  )
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const visibleMainItems = mainItems.filter((item) => canSee(item, role))
  const visibleManagementItems = managementItems.filter((item) =>
    canSee(item, role)
  )
  const visibleActivityItems = activityItems.filter((item) => canSee(item, role))

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col bg-slate-900 p-5 text-white lg:sticky lg:top-0 lg:flex">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold tracking-tight">Audit Sistem</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {role || '-'}
        </p>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto pr-1">
        <div className="space-y-1">
          {visibleMainItems.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {visibleManagementItems.length > 0 && (
          <>
            <SectionTitle>İdarəetmə</SectionTitle>
            <div className="space-y-1">
              {visibleManagementItems.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </>
        )}

        {visibleActivityItems.length > 0 && (
          <>
            <SectionTitle>Fəaliyyət</SectionTitle>
            <div className="space-y-1">
              {visibleActivityItems.map((item) => (
                <SidebarLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="mt-6 border-t border-slate-800 pt-5">
        <LogoutButton />
      </div>
    </aside>
  )
}