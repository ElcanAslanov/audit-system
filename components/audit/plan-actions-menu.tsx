'use client'

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Eye, FilePenLine, Settings2, X } from 'lucide-react'
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
    <div
      className="w-full overflow-visible rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-400">
            <Settings2 size={13} />
            {t('actions')}
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-950">
            {plan.title || '-'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Bağla"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-2">
        <Link
          href={`/dashboard/plans/${plan.id}`}
          onClick={onClose}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          <Eye size={17} />
          {t('view')}
        </Link>

        {canFillPlan && (
          <Link
            href={`/dashboard/plans/${plan.id}/fill`}
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            <FilePenLine size={17} />
            {t('fill')}
          </Link>
        )}

        {canManagePlan && (
          <div className="audit-action-item">
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

        {canManageAccess && (
          <div className="audit-action-item">
            <PlanAccessButton
              plan={plan}
              allUsers={allUsers}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>
        )}

        {canManageLock && (
          <div className="audit-action-item">
            <PlanLockButton
              planId={plan.id}
              lockedEdit={plan.locked_edit}
              lockedView={plan.locked_view}
              compact
            />
          </div>
        )}

        {canDeletePlan && (
          <div className="audit-action-item">
            <PlanDeleteButton planId={plan.id} />
          </div>
        )}
      </div>

      <style jsx global>{`
        .audit-action-item {
          width: 100%;
        }

        .audit-action-item > button,
        .audit-action-item > a {
          width: 100% !important;
          min-height: 44px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          border-radius: 16px !important;
          padding: 10px 16px !important;
          font-size: 14px !important;
          font-weight: 900 !important;
          line-height: 1.2 !important;
          white-space: nowrap !important;
        }

        .audit-action-item svg {
          width: 17px !important;
          height: 17px !important;
          flex-shrink: 0 !important;
        }
      `}</style>
    </div>
  )
}