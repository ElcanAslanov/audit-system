'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { ClipboardCheck, MoreHorizontal } from 'lucide-react'
import PlanCard from '@/components/audit/plan-card'

const PlanActionsMenu = dynamic(
  () => import('@/components/audit/plan-actions-menu'),
  {
    ssr: false,
    loading: () => <ActionMenuSkeleton />,
  }
)

type Props = {
  plans: any[]
  allUsers: any[]
  auditors: any[]
  companies: any[]
  departments: any[]
  templates: any[]
  canCreatePlan: boolean
  currentUserId: string
  currentUserRole?: string | null
  isReadOnlyObserver?: boolean
}

function lockClass(plan: any) {
  if (plan.locked_view) return 'bg-red-50 text-red-700'
  if (plan.locked_edit) return 'bg-yellow-50 text-yellow-700'
  return 'bg-emerald-50 text-emerald-700'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    return `${day}.${month}.${year}`
  }

  return raw
}

export default function PlansViewSwitcher({
  plans,
  allUsers,
  auditors,
  companies,
  departments,
  templates,
  canCreatePlan,
  currentUserId,
  currentUserRole,
  isReadOnlyObserver = false,
}: Props) {
  const t = useTranslations('plans')
  const [view, setView] = useState<'cards' | 'table'>('table')
  const [openActionsPlanId, setOpenActionsPlanId] = useState<string | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)

  const safeCurrentUserRole = currentUserRole || undefined
  const isObserver =
    isReadOnlyObserver ||
    String(safeCurrentUserRole || '').toLowerCase() === 'musahideci'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedView = window.localStorage.getItem('plans-view-mode')

        if (savedView === 'cards' || savedView === 'table') {
          setView(savedView)
        }
      } catch {
        setView('table')
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!openActionsPlanId) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!actionsRef.current) return

      if (!actionsRef.current.contains(event.target as Node)) {
        setOpenActionsPlanId(null)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionsPlanId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openActionsPlanId])

  const changeView = (nextView: 'cards' | 'table') => {
    setView(nextView)
    setOpenActionsPlanId(null)

    try {
      window.localStorage.setItem('plans-view-mode', nextView)
    } catch {
      // localStorage disabled ola bilər, UI yenə işləsin.
    }
  }

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    return value || '-'
  }

  const lockLabel = (plan: any) => {
    if (plan.locked_view) return t('viewAndEditLocked')
    if (plan.locked_edit) return t('editLocked')
    return t('unlocked')
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            {t('currentPlans')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('plansShown', { count: plans.length })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => changeView('cards')}
            className={`rounded-xl px-4 py-2 text-center transition ${
              view === 'cards'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            {t('cardView')}
          </button>

          <button
            type="button"
            onClick={() => changeView('table')}
            className={`rounded-xl px-4 py-2 text-center transition ${
              view === 'table'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            {t('tableView')}
          </button>
        </div>
      </div>

      {plans.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
            <ClipboardCheck size={22} />
          </div>

          <h3 className="mt-4 font-black text-slate-900">{t('noPlans')}</h3>

          <p className="mt-1 text-sm text-slate-500">
            {t('noPlansDescription')}
          </p>
        </div>
      )}

      {plans.length > 0 && view === 'cards' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {plans.map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              allUsers={allUsers}
              auditors={auditors}
              companies={companies}
              departments={departments}
              templates={templates}
              canCreatePlan={canCreatePlan}
              currentUserId={currentUserId}
              currentUserRole={safeCurrentUserRole}
              isReadOnlyObserver={isObserver}
            />
          ))}
        </div>
      )}

      {plans.length > 0 && view === 'table' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('plan')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('company')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('department')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('status')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('locked')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('score')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('startDate')}
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    {t('deadline')}
                  </th>
                  <th className="min-w-[170px] px-4 py-3 text-right font-black text-slate-600">
                    {t('actions')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {plans.map((plan: any) => {
                  const isActionsOpen =
                    openActionsPlanId === String(plan.id || '')

                  return (
                    <tr key={plan.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/dashboard/plans/${plan.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-black text-slate-900 hover:text-blue-600"
                        >
                          {plan.title}
                        </Link>

                        <p className="mt-1 text-xs text-slate-500">
                          {t('answersCount', {
                            count: plan.audit_answers?.length || 0,
                          })}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-top font-semibold text-slate-700">
                        {plan.companies?.name || '-'}
                      </td>

                      <td className="px-4 py-3 align-top text-slate-700">
                        {plan.department || '-'}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {statusLabel(plan.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${lockClass(
                            plan
                          )}`}
                        >
                          {lockLabel(plan)}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-top font-black text-slate-900">
                        {plan.score ?? 0}%
                      </td>

                      <td className="px-4 py-3 align-top text-slate-700">
                        {formatDate(plan.start_date)}
                      </td>

                      <td className="px-4 py-3 align-top text-slate-700">
                        {plan.due_date
                          ? formatDate(plan.due_date)
                          : t('noDeadline')}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="relative flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()

                              setOpenActionsPlanId((current) =>
                                current === String(plan.id || '')
                                  ? null
                                  : String(plan.id || '')
                              )
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <MoreHorizontal size={16} />
                            {t('actions')}
                          </button>

                          {isActionsOpen && (
                            <div
                              ref={actionsRef}
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                              }}
                              className="absolute right-0 top-10 z-20 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                            >
                              <PlanActionsMenu
                                plan={plan}
                                allUsers={allUsers}
                                auditors={auditors}
                                companies={companies}
                                departments={departments}
                                templates={templates}
                                currentUserId={currentUserId}
                                currentUserRole={safeCurrentUserRole}
                                canCreatePlan={canCreatePlan}
                                isObserver={isObserver}
                                onClose={() => setOpenActionsPlanId(null)}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function ActionMenuSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
    </div>
  )
}