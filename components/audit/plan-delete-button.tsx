'use client';

import { useState, useTransition } from 'react';
import { deleteAuditPlan } from '@/app/dashboard/plans/actions';

export default function PlanDeleteButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);

    const confirmed = window.confirm(
      'Bu audit planını silmək istədiyinizə əminsiniz? Bu əməliyyat bu plana aid cavabları, tapıntıları və təyinatları da siləcək.'
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteAuditPlan(planId);

      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="w-full sm:w-auto rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Silinir...' : 'Sil'}
      </button>

      {error && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 shadow-sm sm:max-w-md">
          {error}
        </div>
      )}
    </div>
  );
}