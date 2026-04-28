'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { saveAuditAnswers } from '@/app/dashboard/plans/actions';
import AddFindingForm from '@/components/add-finding-form';
import CompleteAuditButton from '@/components/audit/complete-audit-button';

interface Question {
  id: string;
  question_text: string;
}

interface Answer {
  question_id: string;
  response?: string | null;
  comment?: string | null;
}

interface User {
  id: string;
  full_name: string;
}

interface ChecklistFormProps {
  questions: Question[];
  planId: string;
  initialAnswers?: Answer[];
  users: User[];
}

export default function ChecklistForm({
  questions,
  planId,
  initialAnswers = [],
  users,
}: ChecklistFormProps) {
  const [state, action, pending] = useActionState(saveAuditAnswers, null);
  const [activeFinding, setActiveFinding] = useState<string | null>(null);

  return (
    <>
      <form action={action} className="space-y-6">
        <input type="hidden" name="plan_id" value={planId} />

        {state?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Cavablar uğurla yadda saxlanıldı.
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q: Question) => {
            const savedAnswer = initialAnswers.find(
              (a: Answer) => a.question_id === q.id
            );

            const savedValue = savedAnswer?.response || '';
            const savedComment = savedAnswer?.comment || '';

            return (
              <div key={q.id} className="p-4 border rounded-lg bg-white shadow-sm">
                <label className="block font-semibold mb-3">
                  {q.question_text}
                </label>

                <div className="flex flex-wrap gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value="yes"
                      defaultChecked={savedValue.toLowerCase() === 'yes'}
                    />
                    Bəli
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value="no"
                      defaultChecked={savedValue.toLowerCase() === 'no'}
                      onChange={() => setActiveFinding(q.id)}
                    />
                    Xeyr (Problem)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value="na"
                      defaultChecked={savedValue.toLowerCase() === 'na'}
                    />
                    N/A
                  </label>
                </div>

                <textarea
                  name={`comment_${q.id}`}
                  defaultValue={savedComment}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Şərhinizi əlavə edin..."
                />

                <button
                  type="button"
                  onClick={() => setActiveFinding(q.id)}
                  className="mt-3 text-sm text-red-600 hover:underline"
                >
                  + Tapıntı əlavə et
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 items-start">
          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded"
          >
            {pending ? 'Saxlanılır...' : 'Cavabları Yadda Saxla'}
          </button>

          <CompleteAuditButton planId={planId} />
        </div>
      </form>

      {activeFinding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <AddFindingForm
              planId={planId}
              questionId={activeFinding}
              users={users}
              onClose={() => setActiveFinding(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}