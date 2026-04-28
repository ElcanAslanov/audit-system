'use client'

import { useState } from 'react'
import { createTemplate } from '@/app/dashboard/admin/templates/actions'

export default function TemplateBuilder() {
  // Sualın strukturu yeniləndi (default dəyərlərlə)
  const [sections, setSections] = useState([{ 
    title: '', 
    questions: [{ text: '', type: 'yes_no', weight: 1, max_score: 10 }] 
  }])

  const addSection = () => setSections([...sections, { 
    title: '', 
    questions: [{ text: '', type: 'yes_no', weight: 1, max_score: 10 }] 
  }])

  const addQuestion = (sIdx: number) => {
    const newSections = [...sections]
    newSections[sIdx].questions.push({ text: '', type: 'yes_no', weight: 1, max_score: 10 })
    setSections(newSections)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('sections', JSON.stringify(sections))
    
    const res = await createTemplate(null, formData)
    
    if (res.success) {
      alert("Şablon uğurla yaradıldı!")
    } else {
      alert("Xəta: " + res.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input name="title" placeholder="Şablon Adı" className="w-full border p-2 rounded" required />
      
      {sections.map((s, sIdx) => (
        <div key={sIdx} className="border p-4 rounded bg-slate-50 space-y-2">
          <input 
            placeholder="Bölmə Adı" 
            className="w-full p-2 border rounded" 
            value={s.title}
            onChange={(e) => {
              const newS = [...sections]; 
              newS[sIdx].title = e.target.value; 
              setSections(newS)
            }} 
          />
          
          {s.questions.map((q, qIdx) => (
            <div key={qIdx} className="flex gap-2 items-center bg-white p-2 border rounded">
              <input 
                placeholder="Sual" 
                className="flex-grow p-1 border rounded" 
                value={q.text}
                onChange={(e) => {
                   const newS = [...sections]; 
                   newS[sIdx].questions[qIdx].text = e.target.value; 
                   setSections(newS)
                }} 
              />
              <input 
                type="number"
                placeholder="Weight"
                className="w-16 p-1 border rounded"
                value={q.weight}
                onChange={(e) => {
                   const newS = [...sections]; 
                   newS[sIdx].questions[qIdx].weight = Number(e.target.value); 
                   setSections(newS)
                }}
              />
              <input 
                type="number"
                placeholder="Max"
                className="w-16 p-1 border rounded"
                value={q.max_score}
                onChange={(e) => {
                   const newS = [...sections]; 
                   newS[sIdx].questions[qIdx].max_score = Number(e.target.value); 
                   setSections(newS)
                }}
              />
            </div>
          ))}
          <button type="button" onClick={() => addQuestion(sIdx)} className="text-xs text-blue-600 font-semibold">+ Sual əlavə et</button>
        </div>
      ))}
      
      <button type="button" onClick={addSection} className="text-sm bg-gray-200 px-3 py-1 rounded">+ Bölmə əlavə et</button>
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded ml-4">Yadda Saxla</button>
    </form>
  )
}