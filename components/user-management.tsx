'use client'

import { useState } from 'react'
import { updateUserRole, deleteUser } from '@/app/dashboard/admin/actions'
import { Trash2, UserCog } from 'lucide-react'

export default function UserTable({ users }: { users: any[] }) {
  const [loading, setLoading] = useState(false)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true)
    await updateUserRole(userId, newRole)
    setLoading(false)
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="p-4 font-semibold text-slate-700">İstifadəçi</th>
            <th className="p-4 font-semibold text-slate-700">Rol</th>
            <th className="p-4 font-semibold text-slate-700 text-right">Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition">
              <td className="p-4">{user.full_name}</td>
              <td className="p-4">
                <select 
                  defaultValue={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="bg-transparent border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="auditor">Auditor</option>
                  <option value="muavin">Müavin</option>
                  <option value="rehber">Rəhbər</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="p-4 text-right">
                <button 
                  onClick={() => deleteUser(user.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}