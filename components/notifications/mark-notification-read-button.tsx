'use client'

import {useState, useTransition} from 'react'
import {useRouter} from '@/i18n/routing'

type Props = {
  id: string
  onRead?: (id: string) => void
}

export default function MarkNotificationReadButton({id, onRead}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const markRead = () => {
    if (done || isPending) return

    setDone(true)
    onRead?.(id)

    startTransition(async () => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })

      if (!res.ok) {
        setDone(false)
        router.refresh()
        return
      }

      router.refresh()
    })
  }

  if (done) {
    return (
      <span className="inline-flex justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
        Oxundu
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={isPending}
      className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {isPending ? 'Yenilənir...' : 'Oxundu et'}
    </button>
  )
}