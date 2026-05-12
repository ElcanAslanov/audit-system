'use client'

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import PlanAccessButton from '@/components/audit/plan-access-button'
import PlanLockButton from '@/components/audit/plan-lock-button'
import PlanDeleteButton from '@/components/audit/plan-delete-button'
import PlanEditButton from '@/components/audit/plan-edit-button'

type Props = {
  plan: any
  allUsers: any[]
  auditors: any[]
  companies: any[]
  departments: any[]
  templates: any[]
  currentUserId: string
  currentUserRole?: string
  canCreatePlan: boolean
  isObserver: boolean
  onClose: () => void
}

export default function PlanActionsMenu({
  plan,
  allUsers,
  auditors,
  companies,
  departments,
  templates,
  currentUserId,
  currentUserRole,
  canCreatePlan,
  isObserver,
  onClose,
}: Props) {
  const t = useTranslations('plans')

  const isAdmin = currentUserRole === 'admin'
  const isCreator = String(plan.created_by || '') === String(currentUserId || '')

  const canManageLock = !isObserver && (isAdmin || isCreator)
  const canManageAccess = !isObserver && (isAdmin || isCreator)
  const canManagePlan = !isObserver && (isAdmin || isCreator)
  const canFillPlan = !isObserver && !plan.locked_edit
  const canDeletePlan = !isObserver && canCreatePlan

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClose}
        className="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
      >
        <span>{t('actions')}</span>
        <X size={14} />
      </button>

      {canManageAccess && (
        <PlanAccessButton
          plan={plan}
          allUsers={allUsers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      )}

      {canManagePlan && (
        <PlanEditButton
          plan={plan}
          companies={companies}
          departments={departments}
          auditors={auditors}
          templates={templates}
          compact
        />
      )}

      <Link
        href={`/dashboard/plans/${plan.id}`}
        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
      >
        {t('view')}
      </Link>

      {canFillPlan && (
        <Link
          href={`/dashboard/plans/${plan.id}/fill`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          {t('fill')}
        </Link>
      )}

      {canManageLock && (
        <PlanLockButton
          planId={plan.id}
          lockedEdit={plan.locked_edit}
          lockedView={plan.locked_view}
          compact
        />
      )}

      {canDeletePlan && <PlanDeleteButton planId={plan.id} />}
    </div>
  )
}