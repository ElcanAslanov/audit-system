'use client'
import { useEffect, useState } from 'react'
import { getMonthlyTrend } from '@/app/actions/audit-actions'

export default function TrendAnalysis() {
  const [trends, setTrends] = useState<{name: string, score: number}[]>([])

  useEffect(() => {
    getMonthlyTrend().then(setTrends)
  }, [])

  return (
    <div className="mt-8 bg-white p-6 shadow rounded-lg border">
      <h2 className="text-xl font-semibold mb-4">Aylıq Performans Trendi</h2>
      <div className="space-y-4">
        {trends.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
              <span className="text-sm font-medium text-blue-700">{item.score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${item.score}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}