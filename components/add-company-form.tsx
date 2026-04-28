'use client'

import { useActionState } from 'react'
import { createCompany } from '@/app/dashboard/companies/actions'
import { Loader2, Building2 } from 'lucide-react'

export default function AddCompanyForm() {
  const [state, action, pending] = useActionState(createCompany, null)

  return (
    <form action={action} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şirkət Adı</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            name="name" 
            className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Məs: SOCAR, Azerconnect..." 
            required 
          />
        </div>
      </div>
      
      <button 
        disabled={pending}
        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center gap-2"
      >
        {pending ? <Loader2 className="animate-spin" size={20} /> : 'Əlavə et'}
      </button>

      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
    </form>
  )
}