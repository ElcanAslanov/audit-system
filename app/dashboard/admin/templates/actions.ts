'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTemplate(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const sections = JSON.parse(formData.get('sections') as string)

  if (!title) return { error: "Şablon adı daxil edilməlidir.", success: false }

  try {
    // 1. Əvvəlcə şablonu (template) yaradırıq
    const { data: template, error: tError } = await supabase
      .from('audit_templates')
      .insert({ title })
      .select()
      .single()

    if (tError) throw tError

    // 2. Bölmələri (sections) və sualları (questions) dövrə salıb yazırıq
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx]

      // Bölməni əlavə et
      const { data: newSection, error: sError } = await supabase
        .from('template_sections')
        .insert({ 
            template_id: template.id, 
            title: section.title,
            sort_order: sIdx 
        })
        .select()
        .single()

      if (sError) throw sError

     // Həmin hissəni bu şəkildə dəyiş:
// Həmin hissəni bu şəkildə dəyiş:
if (section.questions && section.questions.length > 0) {
  const questionsToInsert = section.questions.map((q: any, qIdx: number) => ({
    section_id: newSection.id,
    question_text: q.text,
    input_type: q.type || 'yes_no',
    sort_order: qIdx,
    // Yeni sahələri əlavə edirik:
    weight: q.weight || 1,        // Əgər frontend-dən gəlmirsə, default 1 qoyuruq
    max_score: q.max_score || 10  // Default 10 bal
  }))

  const { error: qError } = await supabase
    .from('template_questions')
    .insert(questionsToInsert)

  if (qError) throw qError
}
    }

    revalidatePath('/dashboard/admin/templates')
    return { success: true }
  } catch (err: any) {
    console.error("Şablon yaradılarkən xəta:", err)
    return { success: false, error: err.message }
  }
}