'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCompany, updateCompany } from '@/app/dashboard/companies/actions'
import { Loader2, Pencil, Trash2, X } from 'lucide-react'

export default function CompanyActions({
  company,
}: {
  company: {
    id: string
    name: string
  }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(company.name || '')
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = () => {
    setError(null)

    const formData = new FormData()
    formData.set('name', name)

    startTransition(async () => {
      const result = await updateCompany(company.id, formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      setEditOpen(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    setError(null)

    const confirmed = window.confirm(
      `"${company.name}" şirkətini silmək istədiyinizə əminsiniz?`
    )

    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteCompany(company.id)

      if (result?.error) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setName(company.name || '')
            setError(null)
            setEditOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil size={15} />
          Redaktə
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Sil
        </button>
      </div>

      {error && (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
          {error}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Modalı bağla"
            onClick={() => setEditOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Şirkət redaktəsi
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Şirkət adını yenilə
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-1 block text-sm font-bold text-slate-700">
              Şirkət adı
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Şirkət adı"
            />

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="inline-flex justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Bağla
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleUpdate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                Yadda saxla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}