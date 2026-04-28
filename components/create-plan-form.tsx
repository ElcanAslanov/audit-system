'use client'

import { useState, useMemo, useActionState } from 'react'
import { createAuditPlan } from '@/app/dashboard/plans/actions'
import { Loader2, Plus, Search } from 'lucide-react'

// Props-a templates əlavə edildi
export default function CreatePlanForm({ 
  companies, 
  auditors, 
  templates 
}: { 
  companies: any[], 
  auditors: any[], 
  templates: any[] 
}) {
  const [state, action, pending] = useActionState(createAuditPlan, null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAuditors = useMemo(() => {
    return auditors.filter(a => 
      a.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [auditors, searchTerm])

  return (
    <form action={action} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Yeni Audit Planı Yaradın</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sol Sütun */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Planın Başlığı</label>
            <input name="title" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" required placeholder="Məs: 2026 İllik İT Auditi" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Departament</label>
            <input name="department" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" required placeholder="Məs: İT Departamenti" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şirkət</label>
            <select name="company_id" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" required>
              <option value="">Şirkət seçin...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Yeni: Şablon Seçimi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Audit Şablonu</label>
            <select name="template_id" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" required>
              <option value="">Şablon seçin...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fayl əlavə et</label>
            <input 
              type="file" 
              name="file"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg" 
            />
          </div>
        </div>

        {/* Sağ Sütun */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Auditorları təyin et</label>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Auditor axtar..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
            {filteredAuditors.length > 0 ? (
              filteredAuditors.map(a => (
                <label key={a.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    name="assigned_to" 
                    value={a.id} 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{a.full_name}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-slate-400 p-2 text-center italic">İstifadəçi tapılmadı</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Qeydlər</label>
        <textarea name="notes" rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Audit haqqında əlavə məlumat..." />
      </div>

      <button 
        disabled={pending}
        className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
        {pending ? 'Yaradılır...' : 'Planı Yarat'}
      </button>

      {state?.error && (
        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
          {state.error}
        </p>
      )}
    </form>
  )
}