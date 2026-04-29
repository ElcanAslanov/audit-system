'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus || 'aciq');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (nextStatus: string) => {
    setStatus(nextStatus);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateFindingStatus(findingId, nextStatus, planId);

      if (result.error) {
        setError(result.error);
        setStatus(currentStatus || 'aciq');
        return;
      }

      setMessage('Yeniləndi');
      router.refresh();
    });
  };

  return (
    <div className="space-y-1">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="aciq">Açıq</option>
        <option value="icrada">İcrada</option>
        <option value="hell_olundu">Həll olundu</option>
      </select>

      {isPending && <p className="text-xs text-slate-500">Yenilənir...</p>}

      {message && !isPending && (
        <p className="text-xs font-medium text-emerald-700">{message}</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}