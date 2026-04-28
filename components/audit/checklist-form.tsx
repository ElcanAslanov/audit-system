'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { saveAuditAnswers } from '@/app/dashboard/plans/actions';
import AddFindingForm from '@/components/add-finding-form'; // Adı AddFindingForm olaraq dəyişdik

// Tip təriflərini bura əlavə edirik
interface Question {
  id: string;
  question_text: string;
}

interface Answer {
  question_id: string;
  answer: string;
}

interface User {
  id: string;
  full_name: string;
}

interface ChecklistFormProps {
  questions: Question[];
  planId: string;
  initialAnswers?: Answer[];
  users: User[]; // 'users' prop-unu bura əlavə etdik
}

export default function ChecklistForm({ 
  questions, 
  planId, 
  initialAnswers = [], 
  users // Buraya da əlavə etdik ttt
}: ChecklistFormProps) {
  
  const [state, action, pending] = useActionState(saveAuditAnswers, null);
  const [activeFinding, setActiveFinding] = useState<string | null>(null);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="plan_id" value={planId} />

      <div className="space-y-6">
        {questions.map((q: Question) => { // q-ya tip verdik
          const savedAnswer = initialAnswers.find((a: Answer) => a.question_id === q.id); // a-ya tip verdik
          
          return (
            <div key={q.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <label className="block font-semibold mb-2">{q.question_text}</label>
              
              <div className="flex gap-4 mb-3">
                <label>
                  <input type="radio" name={`status_${q.id}`} value="Yes" defaultChecked={savedAnswer?.answer === 'Yes'} /> Bəli
                </label>
                <label onClick={() => setActiveFinding(q.id)}>
                  <input type="radio" name={`status_${q.id}`} value="No" defaultChecked={savedAnswer?.answer === 'No'} /> Xeyr (Problem)
                </label>
              </div>

              <textarea 
                name={`question_${q.id}`} 
                defaultValue={savedAnswer?.answer || ""}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Şərhinizi əlavə edin..."
              />
            </div>
          );
        })}
      </div>

      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
        {pending ? 'Saxlanılır...' : 'Auditi Tamamla'}
      </button>

      {/* Finding Modal */}
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
    </form>
  );
}