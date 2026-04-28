'use client'

import { useActionState } from 'react'
import { addFinding, ActionState } from '@/app/dashboard/plans/actions'

export default function AddFindingForm({ planId, questionId, users, onClose }: { 
  planId: string, 
  questionId: string, 
  users: any[],
  onClose: () => void 
}) {
  // İndi bura tipini dəqiq verdik: <ActionState, FormData>
  const initialState: ActionState = { error: null, success: false }
  
  const [state, formAction] = useActionState(addFinding, initialState)

  return (
    <form action={formAction} className="p-4 border rounded bg-red-50">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="question_id" value={questionId} /> {/* Bunu əlavə et */}
      <h3 className="font-bold text-red-800 mb-2">Yeni Tapıntı (Finding) Əlavə Et</h3>
      
      {/* Səhvləri və ya uğuru göstər */}
      {state.error && <p className="text-red-600 mb-2">{state.error}</p>}
      {state.success && <p className="text-green-600 mb-2">Tapıntı uğurla əlavə edildi!</p>}
      
      <input name="title" placeholder="Problem başlığı" className="w-full mb-2 p-2 border" required />
      
      <select name="severity" className="w-full mb-2 p-2 border">
        <option value="low">Low Risk</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
      </select>

      <textarea name="description" placeholder="Təsvir" className="w-full mb-2 p-2 border" />
      
      <input type="date" name="deadline" className="w-full mb-2 p-2 border" />

      <select name="assigned_to" className="w-full mb-2 p-2 border">
        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
      </select>

     <div className="flex gap-2">
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">
          Qeyd Et
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
          Bağla
        </button>
      </div>
    </form>
  )
}