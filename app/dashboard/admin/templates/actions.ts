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

// --- 2. Template sil ---
export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()

  if (!templateId) {
    return { success: false, error: 'Template ID tapılmadı.' }
  }

  try {
    // Əvvəl yoxlayırıq: bu template hansı audit planlarında istifadə olunub?
    const { data: usedPlans, error: usageError } = await supabase
      .from('audit_plans')
      .select('id, title, department, status, due_date')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })

    if (usageError) throw usageError

    if (usedPlans && usedPlans.length > 0) {
      const planList = usedPlans
        .map((plan: any, index: number) => {
          const title = plan.title || 'Adsız plan'
          const department = plan.department ? ` — ${plan.department}` : ''
          const status = plan.status ? ` — status: ${plan.status}` : ''
          const dueDate = plan.due_date ? ` — son tarix: ${plan.due_date}` : ''

          return `${index + 1}. ${title}${department}${status}${dueDate}`
        })
        .join('\n')

      return {
        success: false,
        error:
          `Bu şablon ${usedPlans.length} audit planında istifadə olunub.\n\n` +
          `Əvvəl bu audit planlarını silmək lazımdır:\n\n${planList}\n\n` +
          `Bu planları sildikdən sonra şablonu silə bilərsiniz.`,
      }
    }

    // Əvvəl template_sections içindən həmin template-ə aid section-ları çəkirik
    const { data: sections, error: sectionsError } = await supabase
      .from('template_sections')
      .select('id')
      .eq('template_id', templateId)

    if (sectionsError) throw sectionsError

    const sectionIds = (sections || []).map((s: any) => s.id)

    // Əvvəl sualları sil
    if (sectionIds.length > 0) {
      const { error: questionsError } = await supabase
        .from('template_questions')
        .delete()
        .in('section_id', sectionIds)

      if (questionsError) throw questionsError
    }

    // Sonra section-ları sil
    const { error: deleteSectionsError } = await supabase
      .from('template_sections')
      .delete()
      .eq('template_id', templateId)

    if (deleteSectionsError) throw deleteSectionsError

    // Axırda template-i sil
    const { error: templateError } = await supabase
      .from('audit_templates')
      .delete()
      .eq('id', templateId)

    if (templateError) throw templateError

    revalidatePath('/dashboard/admin/templates')

    return { success: true, error: null }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Template silinərkən xəta baş verdi.',
    }
  }
}