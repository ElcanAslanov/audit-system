'use client';

import { useEffect, useState } from 'react';
import { getMonthlyTrend } from '@/app/actions/audit-actions';

type TrendItem = {
  name: string;
  score: number;
};

function scoreClass(score: number) {
  if (score >= 80) return 'text-green-700';
  if (score >= 50) return 'text-yellow-700';
  return 'text-red-700';
}

export default function TrendAnalysis() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonthlyTrend().then((data) => {
      setTrends(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Aylıq Performans Trendi
          </h2>
          <p className="text-sm text-slate-500">
            Audit score göstəricilərinin aylar üzrə dəyişimi
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {loading && (
          <>
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="mb-2 flex justify-between">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-3 w-10 rounded bg-slate-200" />
                </div>
                <div className="h-2.5 rounded-full bg-slate-200" />
              </div>
            ))}
          </>
        )}

        {!loading && trends.length === 0 && (
          <p className="text-sm text-slate-500">
            Trend üçün hələ kifayət qədər audit məlumatı yoxdur.
          </p>
        )}

        {!loading &&
          trends.map((item, idx) => {
            const score = Math.max(0, Math.min(100, Number(item.score || 0)));

            return (
              <div key={`${item.name}-${idx}`}>
                <div className="mb-1 flex justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className={`text-sm font-bold ${scoreClass(score)}`}>
                    {score}%
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}