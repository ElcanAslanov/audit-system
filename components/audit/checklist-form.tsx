'use client';

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
import { saveAuditAnswers } from '@/app/dashboard/plans/actions';
import AddFindingForm from '@/components/add-finding-form';
import CompleteAuditButton from '@/components/audit/complete-audit-button';

interface Question {
  id: string;
  question_text: string;
  max_score?: number | null;
  template_sections?: {
    id?: string;
    title?: string;
    sort_order?: number | null;
    audit_templates?: {
      id?: string;
      title?: string;
    } | null;
  } | null;
}

interface Answer {
  question_id: string;
  response?: string | null;
  comment?: string | null;
  score?: number | null;
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

function answerLabel(value?: string | null) {
  if (value === 'yes') return 'Bəli';
  if (value === 'no') return 'Xeyr';
  if (value === 'na') return 'N/A';
  return 'Seçilməyib';
}

function answerClass(value?: string | null) {
  if (value === 'yes') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'no') return 'border-red-200 bg-red-50 text-red-700';
  if (value === 'na') return 'border-slate-200 bg-slate-50 text-slate-600';
  return 'border-slate-200 bg-white text-slate-500';
}

export default function ChecklistForm({
  questions,
  planId,
  initialAnswers = [],
  users,
}: ChecklistFormProps) {
  const [state, action, pending] = useActionState(saveAuditAnswers, null);
  const [activeFinding, setActiveFinding] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const answerMap = useMemo(() => {
    return new Map(initialAnswers.map((answer) => [answer.question_id, answer]));
  }, [initialAnswers]);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    initialAnswers.forEach((answer) => {
      if (answer.response) {
        initial[answer.question_id] = answer.response;
      }
    });

    return initial;
  });

  const liveAnsweredCount = questions.filter((question) => {
    return !!selectedAnswers[question.id];
  }).length;

  const liveUnansweredCount = Math.max(questions.length - liveAnsweredCount, 0);

  const liveProgressPercent =
    questions.length > 0
      ? Math.round((liveAnsweredCount / questions.length) * 100)
      : 0;

  const handleAnswerChange = (questionId: string, value: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    setHasUnsavedChanges(true);
  };

  const setAllAnswers = (value: 'yes' | 'na') => {
    const next: Record<string, string> = {};

    questions.forEach((question) => {
      next[question.id] = value;
    });

    setSelectedAnswers(next);
    setHasUnsavedChanges(true);
  };

  const clearAllAnswers = () => {
    setSelectedAnswers({});
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (!state?.success) return;
    setHasUnsavedChanges(false);
  }, [state?.success]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return (
    <>
      <form action={action} className="space-y-5">
        <input type="hidden" name="plan_id" value={planId} />

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Doldurma vəziyyəti</h3>
              <p className="mt-1 text-sm text-slate-500">
                {liveAnsweredCount} / {questions.length} sual cavablanıb
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-72">
              <div className="rounded-xl bg-white p-2">
                <p className="font-bold text-slate-900">{questions.length}</p>
                <p className="text-slate-500">Ümumi</p>
              </div>

              <div className="rounded-xl bg-white p-2">
                <p className="font-bold text-emerald-700">{liveAnsweredCount}</p>
                <p className="text-slate-500">Cavablı</p>
              </div>

              <div className="rounded-xl bg-white p-2">
                <p className="font-bold text-red-700">{liveUnansweredCount}</p>
                <p className="text-slate-500">Qalıb</p>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${liveProgressPercent}%` }}
            />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setAllAnswers('yes')}
              className="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              Hamısını Bəli et
            </button>

            <button
              type="button"
              onClick={() => setAllAnswers('na')}
              className="inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Hamısını N/A et
            </button>

            <button
              type="button"
              onClick={clearAllAnswers}
              className="inline-flex w-full justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
            >
              Seçimləri təmizlə
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Cavablar uğurla yadda saxlanıldı.
          </div>
        )}

        {questions.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
            Bu şablonda hələ sual yoxdur.
          </div>
        )}

        <div className="space-y-4">
        {questions.map((q: Question, index: number) => {
  const savedAnswer = answerMap.get(q.id);
  const templateTitle = q.template_sections?.audit_templates?.title || 'Şablon';
  const sectionTitle = q.template_sections?.title || 'Bölmə';
            const savedValue = savedAnswer?.response || '';
            const savedComment = savedAnswer?.comment || '';

            const currentValue = selectedAnswers[q.id] || '';

            const maxScore = Number(q.max_score || 10);
            const savedScore =
              savedAnswer?.score !== undefined && savedAnswer?.score !== null
                ? Number(savedAnswer.score)
                : '';

            return (
              <article
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 sm:p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                   <p className="text-xs font-bold uppercase text-slate-400">
  Sual #{index + 1}
</p>

<div className="mt-2 flex flex-wrap gap-2">
  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
    Şablon: {templateTitle}
  </span>

  <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
    Bölmə: {sectionTitle}
  </span>
</div>


<h3 className="mt-1 text-base font-bold leading-6 text-slate-900 sm:text-lg">
  {q.question_text}
</h3>

<p className="mt-2 text-xs text-slate-500">
  Max score: {q.max_score ?? 10}
</p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${answerClass(
                      currentValue
                    )}`}
                  >
                    {answerLabel(currentValue)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value="yes"
                      checked={currentValue === 'yes'}
                      onChange={() => handleAnswerChange(q.id, 'yes')}
                      className="h-4 w-4"
                    />
                    Bəli
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value="no"
                      defaultChecked={savedValue.toLowerCase() === 'no'}
                      onChange={() => {
                        handleAnswerChange(q.id, 'no');
                        setActiveFinding(q.id);
                      }}
                      className="h-4 w-4"
                    />
                    Xeyr / Problem
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <input
                      type="radio"
                      name={`answer_${q.id}`}
                      value="na"
                      checked={currentValue === 'na'}
                      onChange={() => handleAnswerChange(q.id, 'na')}
                      className="h-4 w-4"
                    />
                    N/A
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Verilən bal
                    </label>

                    <input
                      type="number"
                      name={`score_${q.id}`}
                      min={0}
                      max={maxScore}
                      step="0.5"
                      defaultValue={savedScore}
                      onChange={() => setHasUnsavedChanges(true)}
                      placeholder={`0 - ${maxScore}`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Maksimum bal: {maxScore}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Qiymətləndirmə
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      Bu sual üçün 0 ilə {maxScore} arasında bal verə bilərsiniz.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Şərh
                  </label>

                  <textarea
                    name={`comment_${q.id}`}
                    defaultValue={savedComment}
                    onChange={() => setHasUnsavedChanges(true)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Şərhinizi əlavə edin..."
                  />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveFinding(q.id)}
                    className="inline-flex w-full justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
                  >
                    + Tapıntı əlavə et
                  </button>

                  {savedAnswer?.score !== undefined && (
                    <p className="text-sm font-semibold text-blue-700">
                      Yadda saxlanmış bal: {savedAnswer.score}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:-mx-6 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <p
            className={`mb-3 text-sm sm:mb-0 ${hasUnsavedChanges ? 'font-semibold text-orange-700' : 'text-slate-500'
              }`}
          >
            {hasUnsavedChanges
              ? 'Yadda saxlanılmamış dəyişikliklər var.'
              : 'Dəyişiklikləri itirməmək üçün əvvəlcə cavabları yadda saxlayın.'}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
            >
              {pending ? 'Saxlanılır...' : 'Cavabları Yadda Saxla'}
            </button>

            <CompleteAuditButton
              planId={planId}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
        </div>
      </form>

      {activeFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
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