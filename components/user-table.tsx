'use client'

import { useState } from 'react'
import { updateUserRole, deleteUser } from '@/app/dashboard/admin/actions'
import { Trash2, Edit2, Search } from 'lucide-react'
import EditUserModal from './edit-user-modal'

// 1. Interfeysi yenilədik (companies əlavə olundu)
export default function UserTable({ users, companies }: { users: any[], companies: any[] }) {
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<any>(null)

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = async (id: string, role: string) => {
    setLoadingId(id)
    await updateUserRole(id, role)
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu istifadəçini silmək istədiyinizə əminsiniz?")) return;
    setLoadingId(id)
    await deleteUser(id)
    setLoadingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Axtarış paneli */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          placeholder="İstifadəçi axtar..." 
          className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-slate-700">İstifadəçi</th>
              <th className="p-4 font-semibold text-slate-700">Rol</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium">{user.full_name || "Adsız"}</td>
                <td className="p-4">
                  <select 
                    disabled={loadingId === user.id}
                    defaultValue={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="bg-slate-50 border rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="auditor">Auditor</option>
                    <option value="muavin">Müavin</option>
                    <option value="rehber">Rəhbər</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-4 text-right flex gap-2 justify-end">
                  {/* Edit Düyməsi */}
                  <button 
                    onClick={() => setEditingUser(user)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                    title="Redaktə et"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  {/* Silmə Düyməsi */}
                  <button 
                    onClick={() => handleDelete(user.id)}
                    disabled={loadingId === user.id}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                    title="Sil"
                  >
                    {loadingId === user.id ? '...' : <Trash2 size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {/* 2. Modal-ı çağırarkən companies prop-unu ötürürük */}
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          companies={companies} 
          onClose={() => setEditingUser(null)} 
        />
      )}
    </div>
  )
}