'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAuditPlan } from '@/app/dashboard/plans/actions'
import { Loader2, Trash2 } from 'lucide-react'

export default function PlanDeleteButton({ planId }: { planId: string }) {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)

    const confirmed = window.confirm(
      'Bu audit planını silmək istədiyinizə əminsiniz?\n\nBu əməliyyat plana aid cavabları, tapıntıları, təyinatları və əlavə edilmiş faylı da siləcək.'
    )

    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteAuditPlan(planId)

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}

        {isPending ? 'Silinir...' : 'Sil'}
      </button>

      {error && (
        <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 shadow-sm sm:max-w-md">
          {error}
        </div>
      )}
    </div>
  )
}