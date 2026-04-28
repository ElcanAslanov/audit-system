// app/dashboard/components/DashboardStats.tsx
'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/app/actions/audit-actions'

export default function DashboardStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-gray-500">Analitika yüklənir...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-6 bg-white shadow rounded-lg border border-gray-200">
        <h3 className="text-gray-500 font-medium">Ümumi Performans</h3>
        <p className="text-3xl font-bold mt-2">{stats.averageScore}%</p>
      </div>
      <div className="p-6 bg-white shadow rounded-lg border border-gray-200">
        <h3 className="text-gray-500 font-medium">Açıq Risklər</h3>
        <p className="text-3xl font-bold mt-2 text-red-600">{stats.highRiskCount}</p>
      </div>
      <div className="p-6 bg-white shadow rounded-lg border border-gray-200">
        <h3 className="text-gray-500 font-medium">Tamamlanmış Auditlər</h3>
        <p className="text-3xl font-bold mt-2">{stats.totalAudits}</p>
      </div>
    </div>
  )
}