'use client'

import { useActionState } from 'react'
import { createUser } from '@/app/dashboard/admin/actions'

export default function AddUserForm({ companies }: { companies: any[] }) {
  const [state, action, pending] = useActionState(createUser, null)

  return (
    <form action={action} className="bg-white p-6 border rounded-xl shadow-sm space-y-4 mb-8">
      <h3 className="font-bold text-lg">Yeni İstifadəçi Əlavə Et</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="full_name" placeholder="Tam ad" className="p-2 border rounded" required />
        <input name="email" type="email" placeholder="Email" className="p-2 border rounded" required />
        <input name="password" type="password" placeholder="Şifrə" className="p-2 border rounded" required />
        
        <select name="role" className="p-2 border rounded" required>
          <option value="auditor">Auditor</option>
          <option value="muavin">Müavin</option>
          <option value="rehber">Rəhbər</option>
          <option value="admin">Admin</option>
        </select>

        <select name="company_id" className="p-2 border rounded">
          <option value="">Şirkət seçin</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-500 text-sm">İstifadəçi yaradıldı!</p>}
      
      <button disabled={pending} className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-50">
        {pending ? 'Yaradılır...' : 'İstifadəçi Yarat'}
      </button>
    </form>
  )
}