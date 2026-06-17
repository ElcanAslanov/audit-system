'use client'

import dynamic from 'next/dynamic'
import { Link } from '@/i18n/routing'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  EyeOff,
  FileText,
  Lock,
  MoreHorizontal,
  PencilLine,
  PencilOff,
} from 'lucide-react'

const PlanActionsMenu = dynamic(
  () => import('@/components/audit/plan-actions-menu'),
  {
    ssr: false,
    loading: () => <PlanActionsMenuSkeleton />,
  }
)

type PlanCardProps = {
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
}

type MenuPosition = {
  top: number
  left: number
}

const MENU_WIDTH = 320
const GAP = 8
const PADDING = 12

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
}: PlanCardProps) {
  const t = useTranslations('plans')

  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuPos, setMenuPos] = useState<MenuPosition>({
    top: 0,
    left: 0,
  })

  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const role = String(currentUserRole || '').toLowerCase()
  const isAdmin = role === 'admin'
  const isObserver = isReadOnlyObserver || role === 'musahideci'
  const isCreator = String(plan.created_by || '') === String(currentUserId || '')

  const isEditLocked = Boolean(plan.locked_edit)
  const isViewLocked = Boolean(plan.locked_view)

  const hasAnswers = (plan.audit_answers?.length || 0) > 0
  const answerCount = plan.audit_answers?.length || 0

  const canManageLock = !isObserver && (isAdmin || isCreator)
  const canOpenDetail = isObserver || !isViewLocked || canManageLock
  const canOpenFill =
    !isObserver && !isEditLocked && (!isViewLocked || canManageLock)

  const fillButtonLabel = hasAnswers ? t('edit') : t('fill')

  const statusLabel = (value?: string | null) => {
    if (value === 'tamamlandi') return t('completed')
    if (value === 'needs_attention') return t('needsAttention')
    if (value === 'planlanan') return t('planned')
    return value || '-'
  }

  const assignedNames =
    plan.plan_assignments?.length > 0
      ? plan.plan_assignments
          .map((assignment: any) => assignment.profiles?.full_name)
          .filter(Boolean)
          .join(', ')
      : t('notAssigned')

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight || 460

    let left = rect.right - MENU_WIDTH
    let top = rect.bottom + GAP

    if (left < PADDING) left = PADDING

    if (left + MENU_WIDTH > window.innerWidth - PADDING) {
      left = window.innerWidth - MENU_WIDTH - PADDING
    }

    if (top + menuHeight > window.innerHeight - PADDING) {
      top = rect.top - menuHeight - GAP
    }

    if (top < PADDING) top = PADDING

    setMenuPos({ top, left })
  }, [])

  const openMenu = () => {
    setMenuOpen(true)
    requestAnimationFrame(updateMenuPosition)
  }

  useEffect(() => {
    if (!menuOpen) return

    updateMenuPosition()

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return

      setMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    const handleMove = () => {
      updateMenuPosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleMove, true)
    window.addEventListener('resize', handleMove)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleMove, true)
      window.removeEventListener('resize', handleMove)
    }
  }, [menuOpen, updateMenuPosition])

  return (
    <>
      <article
        onClick={openMenu}
        className="group relative flex min-h-[255px] cursor-pointer flex-col overflow-visible rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
      >
        <div className="overflow-hidden rounded-t-3xl">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        </div>

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

              <button
                ref={buttonRef}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (menuOpen) {
                    setMenuOpen(false)
                  } else {
                    openMenu()
                  }
                }}
                className="inline-grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label={t('actions')}
              >
                <MoreHorizontal size={16} />
              </button>
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
                {t('viewLocked')}
              </span>
            )}

            {!isViewLocked && isEditLocked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700">
                <Lock size={12} />
                {t('editLocked')}
              </span>
            )}

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {t('answersCount', { count: answerCount })}
            </span>

            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {t('startDate')}: {formatDate(plan.start_date)}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              {t('deadline')}:{' '}
              {plan.due_date ? formatDate(plan.due_date) : t('noDeadline')}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t('auditors')}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-700">
              {assignedNames}
            </p>
          </div>

          <div className="mt-auto pt-4" onClick={(event) => event.stopPropagation()}>
            <div
              className={`grid gap-2 ${
                isObserver
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              {canOpenDetail ? (
                <Link
                  href={`/dashboard/plans/${plan.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText size={16} />
                  {t('view')}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-400"
                >
                  <EyeOff size={16} />
                  {t('locked')}
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
                    {t('editLocked')}
                  </button>
                ))}

              {hasAnswers && canOpenDetail && (
                <Link
                  href={`/dashboard/plans/${plan.id}/report`}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {t('pdf')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>

      {mounted &&
        menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: `${MENU_WIDTH}px`,
            }}
            onClick={(event) => event.stopPropagation()}
            className="fixed z-[99999]"
          >
            <PlanActionsMenu
              plan={plan}
              allUsers={allUsers}
              auditors={auditors}
              companies={companies}
              departments={departments}
              templates={templates}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              canCreatePlan={canCreatePlan}
              isObserver={isObserver}
              onClose={() => setMenuOpen(false)}
            />
          </div>,
          document.body
        )}
    </>
  )
}

function PlanActionsMenuSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-8 animate-pulse rounded-xl bg-slate-100" />
    </div>
  )
}