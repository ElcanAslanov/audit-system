'use client'

import { useState } from 'react'
import { updateUserProfile } from '@/app/dashboard/admin/actions'
import { X } from 'lucide-react'

export default function EditUserModal({ user, companies, onClose }: { user: any, companies: any[], onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const res = await updateUserProfile(user.id, {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      company_id: formData.get('company_id') as string,
    })
    setLoading(false)
    if (!res?.error) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">Redaktə Et</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <form action={handleSubmit} className="space-y-4">
          <input name="full_name" defaultValue={user.full_name} className="w-full p-2 border rounded" placeholder="Tam ad" required />
          <input name="email" type="email" defaultValue={user.email} className="w-full p-2 border rounded" placeholder="Email" required />
          
          <select name="role" defaultValue={user.role} className="w-full p-2 border rounded">
            <option value="auditor">Auditor</option>
            <option value="muavin">Müavin</option>
            <option value="rehber">Rəhbər</option>
            <option value="admin">Admin</option>
          </select>

          <select name="company_id" defaultValue={user.company_id || ""} className="w-full p-2 border rounded">
            <option value="">Şirkət yoxdur</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <button disabled={loading} className="w-full bg-slate-900 text-white p-2 rounded hover:bg-slate-800">
            {loading ? 'Yadda saxlanılır...' : 'Yadda Saxla'}
          </button>
        </form>
      </div>
    </div>
  )
}