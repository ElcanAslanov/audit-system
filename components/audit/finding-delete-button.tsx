'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { deleteFinding } from '@/app/[locale]/dashboard/plans/actions'

export default function FindingDeleteButton({
  findingId,
  planId,
  onDeleted,
}: {
  findingId: string
  planId: string
  onDeleted?: () => void
}) {
  const t = useTranslations('findingDelete')
  const locale = useLocale()

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
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
  }, [open, isDeleting])

  const closeModal = () => {
    if (isDeleting) return

    setOpen(false)
    setError(null)
  }

  const handleDelete = async () => {
    if (isDeleting) return

    if (!findingId || !planId) {
      setError(t('missingIds'))
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      const result = await deleteFinding(findingId, planId, locale)

      if (result?.error) {
        setError(result.error)
        setIsDeleting(false)
        return
      }

      setOpen(false)
      setIsDeleting(false)
      onDeleted?.()
    } catch (err: any) {
      setError(err?.message || t('unexpectedError'))
      setIsDeleting(false)
    }
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
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-red-500">
                    {t('modalLabel')}
                  </p>

                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    {t('modalTitle')}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t('modalDescription')}
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
                disabled={isDeleting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={t('cancel')}
                title={t('cancel')}
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 bg-slate-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  closeModal()
                }}
                disabled={isDeleting}
                className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="inline-flex justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {isDeleting ? t('deleting') : t('confirm')}
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
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setError(null)
          setOpen(true)
        }}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-50"
      >
        <Trash2 size={14} />
        {t('delete')}
      </button>

      {modal}
    </>
  )
}