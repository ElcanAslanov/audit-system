'use client';

import { useState, useTransition } from 'react';
import { completeAudit } from '@/app/dashboard/plans/actions';

export default function CompleteAuditButton({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    setMessage(null);
    setError(null);

    const confirmed = window.confirm(
      'Auditi tamamlamaq istədiyinizə əminsiniz? Tamamlandıqdan sonra nəticə dashboard-da görünəcək.'
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await completeAudit(planId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage('Audit uğurla tamamlandı.');
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleComplete}
        className="bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded"
      >
        {isPending ? 'Tamamlanır...' : 'Auditi Tamamla'}
      </button>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}
    </div>
  );
}