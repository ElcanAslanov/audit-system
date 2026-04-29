'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createCompany } from '@/app/dashboard/companies/actions'
import { Loader2, Building2, Plus } from 'lucide-react'

export default function AddCompanyForm({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, action, pending] = useActionState(createCompany, null)

  useEffect(() => {
    if (!state?.success) return

    formRef.current?.reset()
    onSuccess?.()
  }, [state?.success, onSuccess])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-bold text-slate-700">
          Yeni şirkət adı
        </label>

        <div className="relative">
          <Building2
            className="absolute left-3 top-3.5 text-slate-400"
            size={18}
          />

          <input
            name="name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="Məs: SOCAR, Azerconnect..."
            required
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Şirkət uğurla əlavə edildi.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Plus size={18} />
          )}

          {pending ? 'Əlavə olunur...' : 'Əlavə et'}
        </button>
      </div>
    </form>
  )
}