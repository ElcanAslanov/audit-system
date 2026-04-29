'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/app/actions/audit-actions';

type Stats = {
  averageScore: string | number;
  totalAudits: number;
  highRiskCount: number;
};

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-5 h-8 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  const averageScore = Number(stats?.averageScore || 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-blue-700">
              Ümumi Performans
            </h3>
            <p className="mt-2 text-3xl font-black text-blue-900">
              {stats?.averageScore ?? 0}%
            </p>
          </div>

          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-blue-700">
            Score
          </span>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-700 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, averageScore))}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-red-700">
              Açıq Risklər
            </h3>
            <p className="mt-2 text-3xl font-black text-red-700">
              {stats?.highRiskCount ?? 0}
            </p>
          </div>

          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-red-700">
            Risk
          </span>
        </div>

        <p className="mt-4 text-sm text-red-700">
          Diqqət tələb edən audit və risklər
        </p>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-emerald-700">
              Tamamlanmış Auditlər
            </h3>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {stats?.totalAudits ?? 0}
            </p>
          </div>

          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-emerald-700">
            Done
          </span>
        </div>

        <p className="mt-4 text-sm text-emerald-700">
          Tamamlanmış və hesabatlı auditlər
        </p>
      </div>
    </div>
  );
}