'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTemplate(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const sectionsRaw = formData.get('sections') as string

  if (!title?.trim()) {
    return { success: false, error: 'Şablon adı daxil edilməlidir.' }
  }

  let sections: any[] = []

  try {
    sections = JSON.parse(sectionsRaw || '[]')
  } catch {
    return { success: false, error: 'Bölmə məlumatları düzgün deyil.' }
  }

  if (sections.length === 0) {
    return { success: false, error: 'Ən azı 1 bölmə əlavə edin.' }
  }

  try {
    const { data: template, error: templateError } = await supabase
      .from('audit_templates')
      .insert({
        title,
      })
      .select('id')
      .single()

    if (templateError) throw templateError

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]

      if (!section.title?.trim()) {
        throw new Error('Bölmə adı boş ola bilməz.')
      }

      const { data: createdSection, error: sectionError } = await supabase
        .from('template_sections')
        .insert({
          template_id: template.id,
          title: section.title,
          sort_order: sectionIndex,
        })
        .select('id')
        .single()

      if (sectionError) throw sectionError

      const questions = section.questions || []

      if (questions.length === 0) {
        throw new Error('Hər bölmədə ən azı 1 sual olmalıdır.')
      }

      const questionRows = questions.map((question: any, questionIndex: number) => {
        if (!question.text?.trim()) {
          throw new Error('Sual mətni boş ola bilməz.')
        }

        return {
          section_id: createdSection.id,
          question_text: question.text,
          input_type: question.type || 'yes_no',
          sort_order: questionIndex,
          max_score: Number(question.max_score || 10),
        }
      })

      const { error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionRows)

      if (questionsError) throw questionsError
    }

    revalidatePath('/dashboard/admin/templates')
    revalidatePath('/dashboard/plans')

    return { success: true, error: null }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Şablon yaradılarkən xəta baş verdi.',
    }
  }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()

  if (!templateId) {
    return {
      success: false,
      error: 'Template ID tapılmadı.',
    }
  }

  try {
    const { data: usedPlansLegacy, error: usedPlansLegacyError } = await supabase
      .from('audit_plans')
      .select('id, title, status, created_at')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })

    if (usedPlansLegacyError) throw usedPlansLegacyError

    let linkedPlansFromRelation: any[] = []

    const { data: usedPlanLinks, error: usedPlanLinksError } = await supabase
      .from('audit_plan_templates')
      .select(`
        plan_id,
        audit_plans(id, title, status, created_at)
      `)
      .eq('template_id', templateId)

    if (!usedPlanLinksError) {
      linkedPlansFromRelation = (usedPlanLinks || [])
        .map((item: any) => {
          const plan = Array.isArray(item.audit_plans)
            ? item.audit_plans[0] || null
            : item.audit_plans || null

          return plan
        })
        .filter(Boolean)
    }

    const planMap = new Map<string, any>()

    ;[...(usedPlansLegacy || []), ...linkedPlansFromRelation].forEach(
      (plan: any) => {
        if (plan?.id) planMap.set(plan.id, plan)
      }
    )

    const usedPlans = Array.from(planMap.values())

    if (usedPlans.length > 0) {
      const planList = usedPlans
        .map((plan: any, index: number) => {
          return `${index + 1}. ${plan.title || 'Adsız plan'} — status: ${
            plan.status || '-'
          } — id: ${plan.id}`
        })
        .join('\n')

      return {
        success: false,
        error:
          'Bu şablon audit planlarında istifadə olunub. Əvvəl aşağıdakı planları silin və sonra şablonu silin:\n\n' +
          planList,
      }
    }

    await supabase
      .from('audit_plan_templates')
      .delete()
      .eq('template_id', templateId)

    const { data: sections, error: sectionsError } = await supabase
      .from('template_sections')
      .select('id')
      .eq('template_id', templateId)

    if (sectionsError) throw sectionsError

    const sectionIds = (sections || []).map((section: any) => section.id)

    if (sectionIds.length > 0) {
      const { error: questionsError } = await supabase
        .from('template_questions')
        .delete()
        .in('section_id', sectionIds)

      if (questionsError) throw questionsError
    }

    const { error: sectionsDeleteError } = await supabase
      .from('template_sections')
      .delete()
      .eq('template_id', templateId)

    if (sectionsDeleteError) throw sectionsDeleteError

    const { error: templateDeleteError } = await supabase
      .from('audit_templates')
      .delete()
      .eq('id', templateId)

    if (templateDeleteError) {
      if (
        templateDeleteError.message?.includes(
          'audit_plans_template_id_fkey'
        )
      ) {
        return {
          success: false,
          error:
            'Bu şablon hələ audit planlarında istifadə olunur. Audit Planları səhifəsində bu şablonla yaradılmış planları silin, sonra şablonu yenidən silin.',
        }
      }

      throw templateDeleteError
    }

    revalidatePath('/dashboard/admin/templates')
    revalidatePath('/dashboard/plans')

    return {
      success: true,
      error: null,
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'Şablon silinə bilmədi\n\n' + (err.message || 'Naməlum xəta'),
    }
  }
}

// --- 4. Template yenilə ---
export async function updateTemplate(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const templateId = formData.get('template_id') as string
  const title = formData.get('title') as string
  const sectionsRaw = formData.get('sections') as string
  const deletedSectionIdsRaw = formData.get('deleted_section_ids') as string
  const deletedQuestionIdsRaw = formData.get('deleted_question_ids') as string

  if (!templateId) {
    return { success: false, error: 'Template ID tapılmadı.' }
  }

  if (!title) {
    return { success: false, error: 'Şablon adı daxil edilməlidir.' }
  }

  let sections: any[] = []
  let deletedSectionIds: string[] = []
  let deletedQuestionIds: string[] = []

  try {
    sections = JSON.parse(sectionsRaw || '[]')
    deletedSectionIds = JSON.parse(deletedSectionIdsRaw || '[]')
    deletedQuestionIds = JSON.parse(deletedQuestionIdsRaw || '[]')
  } catch {
    return { success: false, error: 'Bölmə məlumatları düzgün deyil.' }
  }

  try {
    const { error: templateError } = await supabase
      .from('audit_templates')
      .update({ title })
      .eq('id', templateId)

    if (templateError) throw templateError

    const realDeletedQuestionIds = deletedQuestionIds.filter(
      (id) => id && !String(id).startsWith('new_')
    )

    if (realDeletedQuestionIds.length > 0) {
      const { error: deleteQuestionsError } = await supabase
        .from('template_questions')
        .delete()
        .in('id', realDeletedQuestionIds)

      if (deleteQuestionsError) throw deleteQuestionsError
    }

    const realDeletedSectionIds = deletedSectionIds.filter(
      (id) => id && !String(id).startsWith('new_')
    )

    if (realDeletedSectionIds.length > 0) {
      const { data: sectionQuestions, error: sectionQuestionsError } =
        await supabase
          .from('template_questions')
          .select('id')
          .in('section_id', realDeletedSectionIds)

      if (sectionQuestionsError) throw sectionQuestionsError

      const sectionQuestionIds = (sectionQuestions || []).map((q: any) => q.id)

      if (sectionQuestionIds.length > 0) {
        const { error: deleteSectionQuestionsError } = await supabase
          .from('template_questions')
          .delete()
          .in('id', sectionQuestionIds)

        if (deleteSectionQuestionsError) throw deleteSectionQuestionsError
      }

      const { error: deleteSectionsError } = await supabase
        .from('template_sections')
        .delete()
        .in('id', realDeletedSectionIds)

      if (deleteSectionsError) throw deleteSectionsError
    }

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]

      let sectionId = section.id

      if (sectionId && !String(sectionId).startsWith('new_')) {
        const { error: sectionError } = await supabase
          .from('template_sections')
          .update({
            title: section.title,
            sort_order: section.sort_order ?? sectionIndex,
          })
          .eq('id', sectionId)

        if (sectionError) throw sectionError
      } else {
        const { data: newSection, error: insertSectionError } = await supabase
          .from('template_sections')
          .insert({
            template_id: templateId,
            title: section.title,
            sort_order: section.sort_order ?? sectionIndex,
          })
          .select('id')
          .single()

        if (insertSectionError) throw insertSectionError

        sectionId = newSection.id
      }

      for (
        let questionIndex = 0;
        questionIndex < (section.questions || []).length;
        questionIndex++
      ) {
        const question = section.questions[questionIndex]

        if (question.id && !String(question.id).startsWith('new_')) {
          const { error: questionError } = await supabase
            .from('template_questions')
            .update({
              question_text: question.question_text,
              input_type: question.input_type || 'yes_no',
              sort_order: question.sort_order ?? questionIndex,
              max_score: Number(question.max_score || 10),
            })
            .eq('id', question.id)

          if (questionError) throw questionError
        } else {
          const { error: insertQuestionError } = await supabase
            .from('template_questions')
            .insert({
              section_id: sectionId,
              question_text: question.question_text,
              input_type: question.input_type || 'yes_no',
              sort_order: question.sort_order ?? questionIndex,
              max_score: Number(question.max_score || 10),
            })

          if (insertQuestionError) throw insertQuestionError
        }
      }
    }

    revalidatePath('/dashboard/admin/templates')
    revalidatePath(`/dashboard/admin/templates/${templateId}`)
    revalidatePath(`/dashboard/admin/templates/${templateId}/edit`)

    return { success: true, error: null }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Şablon yenilənərkən xəta baş verdi.',
    }
  }
}