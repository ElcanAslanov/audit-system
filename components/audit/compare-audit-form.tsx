'use client';

import { useMemo, useState, useTransition } from 'react';
import { getAuditCompareData } from '@/app/dashboard/compare/actions';

type Plan = {
  id: string;
  title: string;
  department?: string | null;
  status?: string | null;
  score?: number | null;
  created_at?: string | null;
  questionIds?: string[];
  sectionIds?: string[];
  companies?: {
    id?: string | null;
    name?: string | null;
  } | null;
};

type CompareResult = {
  left: any;
  right: any;
};

function riskValue(data: any, risk: string) {
  return data?.findings?.filter((f: any) => f.severity === risk).length || 0;
}

function problemAnswers(data: any) {
  return data?.answers?.filter((a: any) => a.response === 'no').length || 0;
}

function totalAnswers(data: any) {
  return data?.answers?.length || 0;
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı';
  if (value === 'needs_attention') return 'Diqqət tələb edir';
  if (value === 'planlanan') return 'Planlanan';
  return value || '-';
}

function scoreTone(score: number) {
  if (score >= 80) return 'text-green-700';
  if (score >= 50) return 'text-yellow-700';
  return 'text-red-700';
}

function answerLabel(value?: string | null) {
  if (value === 'yes') return 'Bəli';
  if (value === 'no') return 'Xeyr';
  if (value === 'na') return 'N/A';
  return '-';
}

function answerBadgeClass(value?: string | null) {
  if (value === 'yes') return 'border-green-200 bg-green-50 text-green-700';
  if (value === 'no') return 'border-red-200 bg-red-50 text-red-700';
  if (value === 'na') return 'border-slate-200 bg-slate-50 text-slate-600';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function normalizeQuestion(answer: any) {
  const question = Array.isArray(answer?.template_questions)
    ? answer.template_questions[0] || null
    : answer?.template_questions || null;

  const section = Array.isArray(question?.template_sections)
    ? question.template_sections[0] || null
    : question?.template_sections || null;

  const template = Array.isArray(section?.audit_templates)
    ? section.audit_templates[0] || null
    : section?.audit_templates || null;

  return {
    question,
    section,
    template,
  };
}

function buildQuestionRows(left: any, right: any) {
  const rowMap = new Map<string, any>();

  function addAnswer(side: 'left' | 'right', answer: any) {
    const { question, section, template } = normalizeQuestion(answer);

    const questionId = answer?.question_id || question?.id;
    if (!questionId) return;

    const existing = rowMap.get(questionId) || {
      questionId,
      questionText: question?.question_text || 'Sual',
      maxScore: Number(question?.max_score || 0),
      sectionTitle: section?.title || '-',
      sectionOrder: Number(section?.sort_order || 0),
      templateTitle: template?.title || '-',
      questionOrder: Number(question?.sort_order || 0),
      leftAnswers: [],
      rightAnswers: [],
    };

    existing[side === 'left' ? 'leftAnswers' : 'rightAnswers'].push(answer);
    rowMap.set(questionId, existing);
  }

  (left?.answers || []).forEach((answer: any) => addAnswer('left', answer));
  (right?.answers || []).forEach((answer: any) => addAnswer('right', answer));

  return Array.from(rowMap.values()).sort((a: any, b: any) => {
    if (a.templateTitle !== b.templateTitle) {
      return a.templateTitle.localeCompare(b.templateTitle, 'az');
    }

    if (a.sectionOrder !== b.sectionOrder) {
      return a.sectionOrder - b.sectionOrder;
    }

    if (a.sectionTitle !== b.sectionTitle) {
      return a.sectionTitle.localeCompare(b.sectionTitle, 'az');
    }

    return a.questionOrder - b.questionOrder;
  });
}

function averageScore(answers: any[]) {
  if (!answers || answers.length === 0) return null;

  const total = answers.reduce(
    (sum: number, answer: any) => sum + Number(answer.score || 0),
    0
  );

  return Math.round(total / answers.length);
}

function ScoreProgress({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-black ${scoreTone(safeScore)}`}>
            {safeScore}%
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Score
        </span>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  left,
  right,
  goodWhenLower = false,
}: {
  title: string;
  left: number;
  right: number;
  goodWhenLower?: boolean;
}) {
  const diff = right - left;
  const isGood = goodWhenLower ? diff <= 0 : diff >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Birinci</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{left}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">İkinci</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{right}</p>
        </div>
      </div>

      <p
        className={`mt-3 text-sm font-bold ${isGood ? 'text-green-700' : 'text-red-700'
          }`}
      >
        Fərq: {diff >= 0 ? '+' : ''}
        {diff}
      </p>
    </div>
  );
}

function hasIntersection(a?: string[], b?: string[]) {
  const left = new Set(a || [])

  for (const value of b || []) {
    if (left.has(value)) return true
  }

  return false
}

function hasComparableComposition(left?: Plan, right?: Plan) {
  if (!left || !right) return true

  return hasIntersection(left.questionIds, right.questionIds)
}

export default function CompareAuditForm({ plans }: { plans: Plan[] }) {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedLeftPlan = useMemo(
    () => plans.find((plan) => plan.id === leftId) || null,
    [plans, leftId]
  );

  const selectedRightPlan = useMemo(
    () => plans.find((plan) => plan.id === rightId) || null,
    [plans, rightId]
  );

  const availableRightPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (plan.id === leftId) return false
      if (!selectedLeftPlan) return true

      return hasComparableComposition(selectedLeftPlan, plan)
    })
  }, [plans, leftId, selectedLeftPlan]);

  const availableLeftPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (plan.id === rightId) return false
      if (!selectedRightPlan) return true

      return hasComparableComposition(plan, selectedRightPlan)
    })
  }, [plans, rightId, selectedRightPlan]);

  const handleCompare = () => {
    setError(null);
    setResult(null);

    if (!leftId || !rightId) {
      setError('Müqayisə üçün iki audit seçin.');
      return;
    }

    if (leftId === rightId) {
      setError('Eyni auditi özü ilə müqayisə etmək olmaz.');
      return;
    }

    startTransition(async () => {
      const response = await getAuditCompareData(leftId, rightId);

      if (!response.success) {
        setError(response.error || 'Müqayisə məlumatı alınmadı.');
        return;
      }

      setResult({
        left: response.left,
        right: response.right,
      });
    });
  };

  const handleReset = () => {
    setLeftId('');
    setRightId('');
    setResult(null);
    setError(null);
  };

  const leftScore = Number(result?.left?.score || 0);
  const rightScore = Number(result?.right?.score || 0);
  const scoreDiff = rightScore - leftScore;

  const highLeft = result ? riskValue(result.left, 'high') : 0;
  const highRight = result ? riskValue(result.right, 'high') : 0;

  const mediumLeft = result ? riskValue(result.left, 'medium') : 0;
  const mediumRight = result ? riskValue(result.right, 'medium') : 0;

  const lowLeft = result ? riskValue(result.left, 'low') : 0;
  const lowRight = result ? riskValue(result.right, 'low') : 0;

  const problemLeft = result ? problemAnswers(result.left) : 0;
  const problemRight = result ? problemAnswers(result.right) : 0;

  const questionRows = result
    ? buildQuestionRows(result.left, result.right)
    : [];

  const questionRowsWithDifference = questionRows.filter((row: any) => {
    const leftAvg = averageScore(row.leftAnswers);
    const rightAvg = averageScore(row.rightAnswers);

    if (leftAvg === null || rightAvg === null) return true;

    return leftAvg !== rightAvg;
  });

  const leftOnlyQuestions = questionRows.filter(
    (row: any) => row.leftAnswers.length > 0 && row.rightAnswers.length === 0
  ).length;

  const rightOnlyQuestions = questionRows.filter(
    (row: any) => row.rightAnswers.length > 0 && row.leftAnswers.length === 0
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Birinci audit
            </label>

            <select
              value={leftId}
              onChange={(e) => {
                const nextLeftId = e.target.value
                const nextLeftPlan =
                  plans.find((plan) => plan.id === nextLeftId) || null
                const currentRightPlan =
                  plans.find((plan) => plan.id === rightId) || null

                setLeftId(nextLeftId)

                if (
                  nextLeftPlan &&
                  currentRightPlan &&
                  !hasComparableComposition(nextLeftPlan, currentRightPlan)
                ) {
                  setRightId('')
                  setResult(null)
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Audit seçin...</option>
              {availableLeftPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} — {plan.companies?.name || '-'} — {plan.score ?? 0}%
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center lg:col-span-2">
            <div className="mb-[1px] rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
              VS
            </div>
          </div>

          <div className="lg:col-span-5">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              İkinci audit
            </label>

            <select
              value={rightId}
              onChange={(e) => {
                const nextRightId = e.target.value
                const nextRightPlan =
                  plans.find((plan) => plan.id === nextRightId) || null
                const currentLeftPlan =
                  plans.find((plan) => plan.id === leftId) || null

                setRightId(nextRightId)

                if (
                  nextRightPlan &&
                  currentLeftPlan &&
                  !hasComparableComposition(currentLeftPlan, nextRightPlan)
                ) {
                  setLeftId('')
                  setResult(null)
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Audit seçin...</option>
              {availableRightPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} — {plan.companies?.name || '-'} — {plan.score ?? 0}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {((rightId && availableLeftPlans.length === 0) ||
          (leftId && availableRightPlans.length === 0)) && (
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                {rightId && availableLeftPlans.length === 0 && (
                  <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
                    Seçilmiş ikinci auditlə ən azı 1 eyni sualı olan başqa plan tapılmadı.
                  </p>
                )}
              </div>

              <div className="hidden lg:col-span-2 lg:block" />

              <div className="lg:col-span-5">
                {leftId && availableRightPlans.length === 0 && (
                  <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
                    Seçilmiş auditlə ən azı 1 eyni sualı olan başqa plan tapılmadı.
                  </p>
                )}
              </div>
            </div>
          )}

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!leftId && !rightId && !result && !error}
            onClick={handleCompare}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300 sm:w-auto"
          >
            {isPending ? 'Müqayisə edilir...' : 'Müqayisə et'}
          </button>

          <button
            type="button"
            disabled={!leftId && !rightId && !result && !error}
            onClick={handleReset}
            className="w-full rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Sıfırla
          </button>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </section>

      {result && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ScoreProgress label={result.left?.title || 'Birinci audit'} score={leftScore} />

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center shadow-sm">
              <p className="text-sm font-semibold text-blue-700">
                Ümumi dəyişiklik
              </p>

              <p
                className={`mt-2 text-4xl font-black ${scoreDiff >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
              >
                {scoreDiff >= 0 ? '+' : ''}
                {scoreDiff}%
              </p>

              <p className="mt-2 text-sm text-blue-700">
                İkinci audit birinci auditlə müqayisədə
              </p>
            </div>

            <ScoreProgress label={result.right?.title || 'İkinci audit'} score={rightScore} />
          </div>
         

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">Birinci audit</h3>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Ad:</span>{' '}
                  <span className="font-semibold">{result.left?.title}</span>
                </p>

                <p>
                  <span className="text-slate-500">Şirkət:</span>{' '}
                  {result.left?.companies?.name || '-'}
                </p>

                <p>
                  <span className="text-slate-500">Departament:</span>{' '}
                  {result.left?.department || '-'}
                </p>

                <p>
                  <span className="text-slate-500">Status:</span>{' '}
                  {statusLabel(result.left?.status)}
                </p>

                <p>
                  <span className="text-slate-500">Checklist cavabları:</span>{' '}
                  {totalAnswers(result.left)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">İkinci audit</h3>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Ad:</span>{' '}
                  <span className="font-semibold">{result.right?.title}</span>
                </p>

                <p>
                  <span className="text-slate-500">Şirkət:</span>{' '}
                  {result.right?.companies?.name || '-'}
                </p>

                <p>
                  <span className="text-slate-500">Departament:</span>{' '}
                  {result.right?.department || '-'}
                </p>

                <p>
                  <span className="text-slate-500">Status:</span>{' '}
                  {statusLabel(result.right?.status)}
                </p>

                <p>
                  <span className="text-slate-500">Checklist cavabları:</span>{' '}
                  {totalAnswers(result.right)}
                </p>
              </div>
            </div>
          </div>         

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Sual-cavab müqayisəsi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Hər sual üzrə iki auditdə verilən cavab, bal və şərh
                  müqayisəsi.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
                  {questionRows.length} sual
                </span>
                <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-bold text-yellow-700">
                  {questionRowsWithDifference.length} fərqli
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                  Sol-only: {leftOnlyQuestions}
                </span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700">
                  Sağ-only: {rightOnlyQuestions}
                </span>
              </div>
            </div>

            {questionRows.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                Bu auditlər üçün müqayisə ediləcək cavab tapılmadı.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {questionRows.map((row: any, index: number) => {
                  const leftAvg = averageScore(row.leftAnswers);
                  const rightAvg = averageScore(row.rightAnswers);

                  const diff =
                    leftAvg === null || rightAvg === null
                      ? null
                      : rightAvg - leftAvg;

                  return (
                    <article key={row.questionId} className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            #{index + 1} • {row.templateTitle} /{' '}
                            {row.sectionTitle}
                          </p>

                          <h3 className="mt-1 text-sm font-black leading-6 text-slate-900 sm:text-base">
                            {row.questionText}
                          </h3>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            Max: {row.maxScore || '-'}
                          </span>

                          {diff !== null && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${diff >= 0
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                                }`}
                            >
                              Fərq: {diff >= 0 ? '+' : ''}
                              {diff}
                            </span>
                          )}

                          {diff === null && (
                            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700">
                              Bir tərəfdə cavab yoxdur
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                            {result.left?.title || 'Birinci audit'}
                          </p>

                          {row.leftAnswers.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                              Bu sual üzrə cavab yoxdur.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {row.leftAnswers.map((answer: any) => (
                                <div
                                  key={answer.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${answerBadgeClass(
                                        answer.response
                                      )}`}
                                    >
                                      {answerLabel(answer.response)}
                                    </span>

                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                      {answer.score ?? 0} /{' '}
                                      {row.maxScore || '-'}
                                    </span>
                                  </div>

                                  {answer.comment && (
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                                      {answer.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                            {result.right?.title || 'İkinci audit'}
                          </p>

                          {row.rightAnswers.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                              Bu sual üzrə cavab yoxdur.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {row.rightAnswers.map((answer: any) => (
                                <div
                                  key={answer.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${answerBadgeClass(
                                        answer.response
                                      )}`}
                                    >
                                      {answerLabel(answer.response)}
                                    </span>

                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                      {answer.score ?? 0} /{' '}
                                      {row.maxScore || '-'}
                                    </span>
                                  </div>

                                  {answer.comment && (
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                                      {answer.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}