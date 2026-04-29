'use client';

import { useEffect, useState } from 'react';
import { getRiskSummary } from '@/app/actions/audit-actions';

export default function RiskSummary() {
  const [summary, setSummary] = useState({
    high: 0,
    medium: 0,
    low: 0,
    open: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRiskSummary().then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Risk xülasəsi yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="border-b pb-4">
        <h2 className="text-lg font-bold text-slate-900">Risk xülasəsi</h2>
        <p className="text-sm text-slate-500">
          Tapıntılar üzrə risk və icra vəziyyəti
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">High</p>
          <p className="mt-1 text-3xl font-black text-red-700">
            {summary.high}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
          <p className="text-sm font-semibold text-yellow-700">Medium</p>
          <p className="mt-1 text-3xl font-black text-yellow-700">
            {summary.medium}
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-700">Low</p>
          <p className="mt-1 text-3xl font-black text-green-700">
            {summary.low}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Açıq tapıntılar</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary.open}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Həll olunanlar</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary.resolved}
          </p>
        </div>
      </div>
    </div>
  );
}