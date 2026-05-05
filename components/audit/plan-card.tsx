'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { EyeOff, FileText, Lock, PencilLine, PencilOff, X } from 'lucide-react'
import PlanLockButton from '@/components/audit/plan-lock-button'
import PlanDeleteButton from '@/components/audit/plan-delete-button'
import PlanAccessButton from '@/components/audit/plan-access-button'
import PlanEditButton from '@/components/audit/plan-edit-button'

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function statusClass(value?: string | null) {
  if (value === 'tamamlandi') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (value === 'needs_attention') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function scoreClass(score?: number | null) {
  const value = Number(score || 0)

  if (value >= 80) return 'bg-emerald-50 text-emerald-700'
  if (value >= 50) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-red-700'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    return `${day}.${month}.${year}`
  }

  const date = new Date(raw)

  if (Number.isNaN(date.getTime())) {
    return raw
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}.${month}.${year}`
}

export default function PlanCard({
  plan,
  allUsers = [],
  auditors = [],
  companies = [],
  departments = [],
  templates = [],
  canCreatePlan,
  currentUserId,
  currentUserRole,
  isReadOnlyObserver = false,
}: {
  plan: any
  allUsers?: any[]
  auditors?: any[]
  companies?: any[]
  departments?: any[]
  templates?: any[]
  canCreatePlan: boolean
  currentUserId: string
  currentUserRole?: string
  isReadOnlyObserver?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const assignedNames =
    plan.plan_assignments?.length > 0
      ? plan.plan_assignments
        .map((a: any) => a.profiles?.full_name)
        .filter(Boolean)
        .join(', ')
      : 'Təyin olunmayıb'

  const hasAnswers = (plan.audit_answers?.length || 0) > 0
  const fillButtonLabel = hasAnswers ? 'Redaktə et' : 'Doldur'
  const answerCount = plan.audit_answers?.length || 0

const role = String(currentUserRole || '').toLowerCase()
const isAdmin = role === 'admin'
const isObserver = isReadOnlyObserver || role === 'musahideci'
const isCreator = plan.created_by === currentUserId

const canManageLock = !isObserver && (isAdmin || isCreator)
const canManageAccess = !isObserver && (isAdmin || isCreator)
const canManagePlan = !isObserver && (isAdmin || isCreator)
const canDeletePlan = !isObserver && canCreatePlan

const isEditLocked = Boolean(plan.locked_edit)
const isViewLocked = Boolean(plan.locked_view)

const canOpenDetail = isObserver || !isViewLocked || canManageLock
const canOpenFill = !isObserver && !isEditLocked && (!isViewLocked || canManageLock)

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <article
      onClick={() => setMenuOpen(true)}
      className="group relative flex min-h-[255px] cursor-pointer flex-col overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="overflow-hidden rounded-t-3xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-4 top-4 z-20 w-64 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-400">
                Plan seçimi
              </p>
              <p className="mt-1 truncate text-sm font-black text-slate-900">
                {plan.title}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <X size={15} />
            </button>
          </div>

          <div className="space-y-2">
            {canOpenDetail ? (
              <Link
                href={`/dashboard/plans/${plan.id}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FileText size={16} />
                Bax
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-400"
              >
                <EyeOff size={16} />
                Baxış kilidli
              </button>
            )}

           {!isObserver &&
  (canOpenFill ? (
    <Link
      href={`/dashboard/plans/${plan.id}/fill`}
      className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
    >
      <PencilLine size={16} />
      {fillButtonLabel}
    </Link>
  ) : (
    <button
      type="button"
      disabled
      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-400"
    >
      <PencilOff size={16} />
      Redaktə kilidli
    </button>
  ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-950">
              {plan.title}
            </h3>

            <p className="mt-2 line-clamp-1 text-sm text-slate-500">
              {plan.department || '-'} • {plan.companies?.name || '-'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-black ${scoreClass(
                plan.score
              )}`}
            >
              {plan.score ?? 0}%
            </span>

            {canManageAccess && (
              <div onClick={(e) => e.stopPropagation()}>
                <PlanAccessButton
                  plan={plan}
                  allUsers={allUsers}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              </div>
            )}

            {canManagePlan && (
  <div onClick={(e) => e.stopPropagation()}>
    <PlanEditButton
      plan={plan}
      companies={companies}
      departments={departments}
      auditors={auditors}
      templates={templates}
      compact
    />
  </div>
)}

            {canManageLock && (
              <div onClick={(e) => e.stopPropagation()}>
                <PlanLockButton
                  planId={plan.id}
                  lockedEdit={plan.locked_edit}
                  lockedView={plan.locked_view}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
              plan.status
            )}`}
          >
            {statusLabel(plan.status)}
          </span>

          {isViewLocked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
              <EyeOff size={12} />
              Baxış kilidli
            </span>
          )}

          {!isViewLocked && isEditLocked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700">
              <Lock size={12} />
              Redaktə kilidli
            </span>
          )}

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
            {answerCount} cavab
          </span>

          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
            Başlama: {formatDate(plan.start_date)}
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
            Son tarix: {formatDate(plan.due_date)}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Auditorlar
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-700">
            {assignedNames}
          </p>
        </div>

        <div className="mt-auto pt-4" onClick={(e) => e.stopPropagation()}>
         <div className={`grid gap-2 ${isObserver ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {canOpenDetail ? (
              <Link
                href={`/dashboard/plans/${plan.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FileText size={16} />
                Bax
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-400"
              >
                <EyeOff size={16} />
                Kilidli
              </button>
            )}

           {!isObserver &&
  (canOpenFill ? (
    <Link
      href={`/dashboard/plans/${plan.id}/fill`}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
    >
      <PencilLine size={16} />
      {fillButtonLabel}
    </Link>
  ) : (
    <button
      type="button"
      disabled
      className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-400"
    >
      <PencilOff size={16} />
      Redaktə kilidli
    </button>
  ))}

            {hasAnswers && canOpenDetail && (
              <Link
                href={`/dashboard/plans/${plan.id}/report`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                PDF
              </Link>
            )}

           {canDeletePlan && <PlanDeleteButton planId={plan.id} />}

          </div>
        </div>
      </div>
    </article>
  )
}