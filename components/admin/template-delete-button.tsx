'use client'

import { useState, useTransition } from 'react'
import { deleteTemplate } from '@/app/dashboard/admin/templates/actions'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'

export default function TemplateDeleteButton({
  templateId,
}: {
  templateId: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const closeModal = () => {
    if (isPending) return
    setOpen(false)
    setError(null)
  }

  const handleDelete = () => {
    setError(null)

    startTransition(async () => {
      const result = await deleteTemplate(templateId)

      if (!result.success) {
        setError(result.error || 'Şablon silinmədi.')
        return
      }

      setOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Trash2 size={16} />
        Sil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-red-500">
                    Şablon silmə
                  </p>

                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Audit şablonu silinsin?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Bu əməliyyat şablona aid bölmələri və sualları da silə
                    bilər. Əməliyyatı geri qaytarmaq mümkün olmaya bilər.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
                <p className="mb-1 font-black">Şablon silinə bilmədi</p>
                <p className="whitespace-pre-wrap break-words">{error}</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 bg-slate-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ləğv et
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}

                {isPending ? 'Silinir...' : 'Bəli, sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}