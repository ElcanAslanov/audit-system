'use client';

import { useState, useTransition } from 'react';
import { updateFindingStatus } from '@/app/dashboard/plans/actions';

type Props = {
  findingId: string;
  planId: string;
  currentStatus?: string | null;
};

export default function FindingStatusSelect({
  findingId,
  planId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState(currentStatus || 'aciq');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (nextStatus: string) => {
    setStatus(nextStatus);
    setError(null);

    startTransition(async () => {
      const result = await updateFindingStatus(findingId, nextStatus, planId);

      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-1">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="border rounded px-2 py-1 text-sm bg-white disabled:bg-slate-100"
      >
        <option value="aciq">Açıq</option>
        <option value="icrada">İcrada</option>
        <option value="hell_olundu">Həll olundu</option>
      </select>

      {isPending && (
        <p className="text-xs text-slate-500">Yenilənir...</p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}