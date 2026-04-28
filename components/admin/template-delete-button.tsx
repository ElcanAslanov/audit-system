'use client';

import { useState, useTransition } from 'react';
import { deleteTemplate } from '@/app/dashboard/admin/templates/actions';

export default function TemplateDeleteButton({
  templateId,
}: {
  templateId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);

    const confirmed = window.confirm(
      'Bu audit şablonunu silmək istədiyinizə əminsiniz? Bu əməliyyat section və sualları da siləcək.'
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteTemplate(templateId);

      if (!result.success) {
        setError(result.error || 'Template silinmədi.');
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto lg:flex-row lg:items-start">
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="w-full sm:w-auto shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Silinir...' : 'Sil'}
      </button>

      {error && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 shadow-sm sm:max-w-md lg:w-96">
          <p className="mb-1 font-semibold">Şablon silinə bilmədi</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}