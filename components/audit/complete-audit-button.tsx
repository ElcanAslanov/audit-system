'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { checkAuditReady } from '@/app/dashboard/plans/actions'

export default function CompleteAuditButton({
  planId,
  hasUnsavedChanges = false,
}: {
  planId: string
  hasUnsavedChanges?: boolean
}) {
  const router = useRouter()

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleComplete = () => {
    setError(null)

    if (hasUnsavedChanges) {
      setError(
        'Dəyişikliklər yadda saxlanılmayıb. Əvvəlcə “Cavabları Yadda Saxla” düyməsinə basın.'
      )
      return
    }

    startTransition(async () => {
      const result = await checkAuditReady(planId)

      if (result.error) {
        setError(result.error)
        return
      }

      router.refresh()
      router.push(`/dashboard/plans/${planId}`)
    })
  }

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <button
        type="button"
        disabled={isPending}
        onClick={handleComplete}
        className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? 'Yoxlanılır...' : 'Audit detail səhifəsinə keç'}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}