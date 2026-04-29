'use client'

import { logoutAction } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

type LogoutButtonProps = {
  compact?: boolean
}

export default function LogoutButton({ compact = false }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => logoutAction()}
      title="Çıxış"
      aria-label="Çıxış"
      className={`group flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 text-sm font-bold text-red-200 transition hover:bg-red-500/20 hover:text-white ${
        compact ? 'h-10 w-10 p-0' : 'w-full px-4 py-2.5'
      }`}
    >
      <LogOut
        size={18}
        className="shrink-0 transition group-hover:-translate-x-0.5"
      />

      {!compact && <span>Çıxış</span>}
    </button>
  )
}