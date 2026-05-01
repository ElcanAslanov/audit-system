'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAuditPlanLock } from '@/app/dashboard/plans/actions'
import { EyeOff, Loader2, Lock, LockOpen, PencilOff } from 'lucide-react'

export default function PlanLockButton({
  planId,
  lockedEdit,
  lockedView,
  compact = false,
}: {
  planId: string
  lockedEdit?: boolean | null
  lockedView?: boolean | null
  compact?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentLabel = lockedView
    ? 'Tam kilidli'
    : lockedEdit
      ? 'Redaktə kilidli'
      : 'Kilidsiz'

  const handleLock = (lockType: 'none' | 'edit' | 'view') => {
    setError(null)

    startTransition(async () => {
      const result = await updateAuditPlanLock(planId, lockType)

      if (result?.error) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button
  type="button"
  disabled={isPending}
  title={currentLabel}
  onClick={() => setOpen((prev) => !prev)}
  className={`inline-flex items-center justify-center rounded-full border font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
    compact ? 'h-8 w-8 p-0' : 'w-full gap-2 px-3 py-2.5 text-sm'
  } ${  lockedView
            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
            : lockedEdit
              ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : lockedView ? (
          <EyeOff size={16} />
        ) : lockedEdit ? (
          <PencilOff size={16} />
        ) : (
          <Lock size={16} />
        )}

        {!compact && currentLabel}
      </button>

      {open && (
      <div className="absolute right-0 top-full z-[9999] mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0 sm:w-72">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Plan kilidi
          </p>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleLock('none')}
              className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <LockOpen size={16} />
              Kilidi aç
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleLock('edit')}
              className="flex w-full items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-left text-sm font-bold text-yellow-800 transition hover:bg-yellow-100 disabled:opacity-60"
            >
              <PencilOff size={16} />
              Yalnız redaktəni kilidlə
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleLock('view')}
              className="flex w-full items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              <EyeOff size={16} />
              Baxışı və redaktəni kilidlə
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}