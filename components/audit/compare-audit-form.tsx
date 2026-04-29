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
  companies?: {
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
        className={`mt-3 text-sm font-bold ${
          isGood ? 'text-green-700' : 'text-red-700'
        }`}
      >
        Fərq: {diff >= 0 ? '+' : ''}
        {diff}
      </p>
    </div>
  );
}

export default function CompareAuditForm({ plans }: { plans: Plan[] }) {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableRightPlans = useMemo(
    () => plans.filter((p) => p.id !== leftId),
    [plans, leftId]
  );

  const availableLeftPlans = useMemo(
    () => plans.filter((p) => p.id !== rightId),
    [plans, rightId]
  );

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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Birinci audit
            </label>

            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Audit seçin...</option>
              {availableLeftPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} — {plan.companies?.name || '-'} —{' '}
                  {plan.score ?? 0}%
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center lg:col-span-2">
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
              VS
            </div>
          </div>

          <div className="lg:col-span-5">
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              İkinci audit
            </label>

            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Audit seçin...</option>
              {availableRightPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} — {plan.companies?.name || '-'} —{' '}
                  {plan.score ?? 0}%
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={isPending}
            onClick={handleCompare}
            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300 sm:w-auto"
          >
            {isPending ? 'Müqayisə edilir...' : 'Müqayisə et'}
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
                className={`mt-2 text-4xl font-black ${
                  scoreDiff >= 0 ? 'text-green-700' : 'text-red-700'
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="High Risk"
              left={highLeft}
              right={highRight}
              goodWhenLower
            />

            <MetricCard
              title="Medium Risk"
              left={mediumLeft}
              right={mediumRight}
              goodWhenLower
            />

            <MetricCard
              title="Low Risk"
              left={lowLeft}
              right={lowRight}
              goodWhenLower
            />

            <MetricCard
              title="Problemli cavablar"
              left={problemLeft}
              right={problemRight}
              goodWhenLower
            />
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
            <div className="bg-slate-50 px-4 py-3">
              <h2 className="font-bold text-slate-900">Metrik müqayisəsi</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Metrik</th>
                    <th className="px-4 py-3">{result.left?.title}</th>
                    <th className="px-4 py-3">{result.right?.title}</th>
                    <th className="px-4 py-3">Fərq</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-semibold">Score</td>
                    <td className="px-4 py-3">{leftScore}%</td>
                    <td className="px-4 py-3">{rightScore}%</td>
                    <td className="px-4 py-3 font-bold">
                      {scoreDiff >= 0 ? '+' : ''}
                      {scoreDiff}%
                    </td>
                  </tr>

                  <tr>
                    <td className="px-4 py-3 font-semibold">High Risk</td>
                    <td className="px-4 py-3">{highLeft}</td>
                    <td className="px-4 py-3">{highRight}</td>
                    <td className="px-4 py-3">{highRight - highLeft}</td>
                  </tr>

                  <tr>
                    <td className="px-4 py-3 font-semibold">Medium Risk</td>
                    <td className="px-4 py-3">{mediumLeft}</td>
                    <td className="px-4 py-3">{mediumRight}</td>
                    <td className="px-4 py-3">{mediumRight - mediumLeft}</td>
                  </tr>

                  <tr>
                    <td className="px-4 py-3 font-semibold">Low Risk</td>
                    <td className="px-4 py-3">{lowLeft}</td>
                    <td className="px-4 py-3">{lowRight}</td>
                    <td className="px-4 py-3">{lowRight - lowLeft}</td>
                  </tr>

                  <tr>
                    <td className="px-4 py-3 font-semibold">
                      Checklist cavabları
                    </td>
                    <td className="px-4 py-3">{totalAnswers(result.left)}</td>
                    <td className="px-4 py-3">{totalAnswers(result.right)}</td>
                    <td className="px-4 py-3">
                      {totalAnswers(result.right) - totalAnswers(result.left)}
                    </td>
                  </tr>

                  <tr>
                    <td className="px-4 py-3 font-semibold">
                      Problemli cavablar
                    </td>
                    <td className="px-4 py-3">{problemLeft}</td>
                    <td className="px-4 py-3">{problemRight}</td>
                    <td className="px-4 py-3">{problemRight - problemLeft}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}