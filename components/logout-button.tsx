'use client'

import { logoutAction } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition w-full p-3 hover:bg-slate-800 rounded-lg"
    >
      <LogOut size={18} />
      Çıxış
    </button>
  )
}