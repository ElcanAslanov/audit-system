'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateAuditPlanLock } from '@/app/dashboard/plans/actions'
import { EyeOff, Loader2, Lock, LockOpen, PencilOff, X } from 'lucide-react'

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

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setOpen(false)
        setError(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, isPending])

  const currentLabel = lockedView
    ? 'Tam kilidli'
    : lockedEdit
      ? 'Redaktə kilidli'
      : 'Kilidsiz'

  const closeModal = () => {
    if (isPending) return

    setOpen(false)
    setError(null)
  }

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

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              closeModal()
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      lockedView
                        ? 'bg-red-50 text-red-600'
                        : lockedEdit
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lockedView ? (
                      <EyeOff size={22} />
                    ) : lockedEdit ? (
                      <PencilOff size={22} />
                    ) : (
                      <Lock size={22} />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Plan kilidi
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-950">
                      Kilid rejimini seç
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Hazırki vəziyyət:{' '}
                      <span className="font-black text-slate-800">
                        {currentLabel}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    closeModal()
                  }}
                  disabled={isPending}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-2 bg-slate-50 p-5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleLock('none')}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                    <LockOpen size={16} />
                  </span>

                  <span>
                    <span className="block font-black">Kilidi aç</span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      Plan yenidən redaktə və baxış üçün açıq olacaq.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleLock('edit')}
                  className="flex w-full items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-left text-sm font-bold text-yellow-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-yellow-800">
                    <PencilOff size={16} />
                  </span>

                  <span>
                    <span className="block font-black">
                      Yalnız redaktəni kilidlə
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-yellow-800/70">
                      Plan görünəcək, amma doldurma/redaktə bağlanacaq.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleLock('view')}
                  className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-red-700">
                    <EyeOff size={16} />
                  </span>

                  <span>
                    <span className="block font-black">
                      Baxışı və redaktəni kilidlə
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-red-700/70">
                      Plan həm baxış, həm də redaktə üçün bağlanacaq.
                    </span>
                  </span>
                </button>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-white p-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Bağla
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        title={currentLabel}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
        className={`inline-flex items-center justify-center rounded-full border font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          compact ? 'h-8 w-8 p-0' : 'w-full gap-2 px-3 py-2.5 text-sm'
        } ${
          lockedView
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

      {modal}
    </>
  )
}