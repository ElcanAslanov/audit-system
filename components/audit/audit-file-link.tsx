'use client';

import { useState, useTransition } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function AuditFileLink({ filePath }: { filePath: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const openFile = () => {
    setError(null);

    startTransition(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.storage
        .from('audit-docs')
        .createSignedUrl(filePath, 60 * 5);

      if (error || !data?.signedUrl) {
        setError(error?.message || 'Fayl linki yaradıla bilmədi.');
        return;
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={openFile}
        className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {isPending ? 'Açılır...' : 'Faylı aç / yüklə'}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}