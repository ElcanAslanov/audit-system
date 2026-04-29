'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './logout-button'

type MobileSidebarProps = {
  role: string
}

type MenuItem = {
  label: string
  href: string
  roles?: string[]
}

const allRoles = ['admin', 'rehber', 'muavin', 'audit_muavini', 'auditor']

const menuItems: MenuItem[] = [
  {
    label: 'Ana Səhifə',
    href: '/dashboard',
    roles: allRoles,
  },
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
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm lg:hidden">
        <div>
          <p className="text-base font-extrabold text-slate-900">
            Audit Sistem
          </p>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {role || '-'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <aside className="relative z-10 flex h-full w-[82%] max-w-xs flex-col bg-slate-900 p-5 text-white shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold">Audit Sistem</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {role || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Bağla
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {visibleItems.map((item) => {
                const active = isActivePath(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}