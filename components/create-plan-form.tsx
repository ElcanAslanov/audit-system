'use client'

import { useEffect, useMemo, useRef, useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createAuditPlan } from '@/app/dashboard/plans/actions'
import { Loader2, Plus, Search, UploadCloud } from 'lucide-react'

export default function CreatePlanForm({
  companies,
  auditors,
  templates,
  onSuccess,
}: {
  companies: any[]
  auditors: any[]
  templates: any[]
  onSuccess?: () => void
}) {
const router = useRouter()
const formRef = useRef<HTMLFormElement | null>(null)

const [state, action, pending] = useActionState(createAuditPlan, null)
const [searchTerm, setSearchTerm] = useState('')

useEffect(() => {
  if (!state?.success) return

  formRef.current?.reset()
  setSearchTerm('')
  router.refresh()
  onSuccess?.()
}, [state?.success, router, onSuccess])

const filteredAuditors = useMemo(() => {
    return auditors.filter((a) =>
      (a.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [auditors, searchTerm])

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Audit planı uğurla yaradıldı.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Planın başlığı
              </label>
              <input
                name="title"
                required
                placeholder="Məs: 2026 İllik İT Auditi"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Departament
              </label>
              <input
                name="department"
                required
                placeholder="Məs: İT Departamenti"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Son tarix
              </label>
              <input
                type="date"
                name="due_date"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Şirkət
              </label>
              <select
                name="company_id"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Şirkət seçin...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Audit şablonu
              </label>
              <select
                name="template_id"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Şablon seçin...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Qeydlər
              </label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Audit haqqında əlavə məlumat..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UploadCloud size={18} />
              Fayl əlavə et
            </label>

            <input
              type="file"
              name="file"
              className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white text-sm text-slate-500 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />

            <p className="mt-2 text-xs text-slate-500">
              PDF, Word, Excel və ya digər sübut faylları əlavə edə bilərsiniz.
            </p>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Auditorları təyin et
            </label>

            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Auditor axtar..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
            {filteredAuditors.length > 0 ? (
              filteredAuditors.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-white"
                >
                  <input
                    type="checkbox"
                    name="assigned_to"
                    value={a.id}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {a.full_name}
                    </p>
                    <p className="text-xs uppercase text-slate-400">
                      {a.role || 'auditor'}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-sm italic text-slate-400">
                  İstifadəçi tapılmadı
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              Qısa məlumat
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-700">
              Plan yaradıldıqdan sonra auditorlar checklist səhifəsindən
              cavabları doldura və tapıntı əlavə edə biləcəklər.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {pending ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {pending ? 'Yaradılır...' : 'Planı Yarat'}
        </button>
      </div>
    </form>
  )
}