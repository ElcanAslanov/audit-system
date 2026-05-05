'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { deleteFindingFile } from '@/app/dashboard/plans/actions'

export default function FindingFileDeleteButton({
  findingId,
  planId,
  filePath,
  fileName,
}: {
  findingId: string
  planId: string
  filePath: string
  fileName?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closeModal = () => {
    if (isDeleting) return
    setOpen(false)
    setError(null)
  }

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)
    setIsHidden(true)

    const result = await deleteFindingFile(findingId, planId, filePath)

    if (result.error) {
      setIsHidden(false)
      setIsDeleting(false)
      setError(result.error)
      return
    }

    setOpen(false)
    window.location.reload()
  }

  if (isHidden) {
    return (
      <span className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400">
        <Loader2 size={13} className="animate-spin" />
        Silinir...
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
      >
        Sil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
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
                    Fayl silmə
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Fayl silinsin?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Bu fayl çatışmazlıqdan silinəcək. çatışmazlıqnın özü qalacaq.
                  </p>

                  {fileName && (
                    <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                      {fileName}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                onClick={closeModal}
                disabled={isDeleting}
                className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ləğv et
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {isDeleting ? 'Silinir...' : 'Bəli, sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}