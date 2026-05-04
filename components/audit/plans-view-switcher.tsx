'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PlanCard from '@/components/audit/plan-card'
import PlanAccessButton from '@/components/audit/plan-access-button'
import PlanLockButton from '@/components/audit/plan-lock-button'
import PlanDeleteButton from '@/components/audit/plan-delete-button'
import { ClipboardCheck } from 'lucide-react'

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function lockLabel(plan: any) {
  if (plan.locked_view) return 'Baxış və redaktə kilidli'
  if (plan.locked_edit) return 'Redaktə kilidli'
  return 'Kilidsiz'
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

type Props = {
  plans: any[]
  allUsers: any[]
  canCreatePlan: boolean
  currentUserId: string
  currentUserRole?: string | null
}

export default function PlansViewSwitcher({
  plans,
  allUsers,
  canCreatePlan,
  currentUserId,
  currentUserRole,
}: Props) {
const [view, setView] = useState<'cards' | 'table'>('cards')

useEffect(() => {
  const savedView = window.localStorage.getItem('plans-view-mode')

  if (savedView === 'cards' || savedView === 'table') {
    setView(savedView)
  }
}, [])

const changeView = (nextView: 'cards' | 'table') => {
  setView(nextView)
  window.localStorage.setItem('plans-view-mode', nextView)
}
  const safeCurrentUserRole = currentUserRole || undefined

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Cari Planlar</h2>
          <p className="mt-1 text-sm text-slate-500">
            {plans.length} audit planı göstərilir.
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
            Kart
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
            Tablo
          </button>
        </div>
      </div>

      {plans.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
            <ClipboardCheck size={22} />
          </div>

          <h3 className="mt-4 font-black text-slate-900">
            Audit planı tapılmadı
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Seçilmiş filterlərə uyğun nəticə yoxdur.
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
              canCreatePlan={canCreatePlan}
              currentUserId={currentUserId}
              currentUserRole={safeCurrentUserRole}
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
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Şirkət
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Departament
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Kilid
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Başlama
                  </th>
                  <th className="px-4 py-3 text-left font-black text-slate-600">
                    Deadline
                  </th>
                  <th className="min-w-[360px] px-4 py-3 text-right font-black text-slate-600">
                    Əməliyyat
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {plans.map((plan: any) => {
                  const isAdmin = safeCurrentUserRole === 'admin'
                  const isCreator = plan.created_by === currentUserId
                  const canManageLock = isAdmin || isCreator

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
                          {plan.audit_answers?.length || 0} cavab
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
                        {formatDate(plan.due_date)}
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <div
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}
                          >
                            <PlanAccessButton
                              plan={plan}
                              allUsers={allUsers}
                              currentUserId={currentUserId}
                              currentUserRole={safeCurrentUserRole}
                            />
                          </div>

                          <Link
                            href={`/dashboard/plans/${plan.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Bax
                          </Link>

                          {!plan.locked_edit && (
                            <Link
                              href={`/dashboard/plans/${plan.id}/fill`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                              Doldur
                            </Link>
                          )}

                          {canManageLock && (
                            <div
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                              }}
                            >
                              <PlanLockButton
                                planId={plan.id}
                                lockedEdit={plan.locked_edit}
                                lockedView={plan.locked_view}
                                compact
                              />
                            </div>
                          )}

                          {canCreatePlan && (
                            <div
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                              }}
                            >
                              <PlanDeleteButton planId={plan.id} />
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