'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error: string | null;
  success: boolean;
};

/**
 * Fayl adını təmizləyən köməkçi funksiya.
 * Azərbaycan hərflərini, boşluqları və xüsusi simvolları təmizləyir.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/gi, "")
    .toLowerCase();
}

type Locale = 'az' | 'en' | 'ru'

const I18N = {
  az: {
    profileNotFound: 'Profil tapılmadı.',
    userNotFound: 'İstifadəçi tapılmadı.',
    observerReadOnly: 'Müşahidəçi yalnız baxış icazəsinə malikdir.',
    auditAssistantCompanyMissing:
      'Audit müavininin şirkəti təyin edilməyib. Auditor təyin etmək mümkün deyil.',
    auditAssistantAuditorRestriction:
      'Audit müavini yalnız öz şirkətinə aid auditorları təyin edə bilər.',

    invalidStartDate: 'Başlama tarixi düzgün formatda deyil.',
    invalidDueDate: 'Son tarix düzgün formatda deyil.',
    startAfterDue: 'Başlama tarixi son tarixdən sonra ola bilməz.',
    titleRequired: 'Plan başlığı daxil edilməlidir.',
    companyRequired: 'Şirkət seçilməlidir.',
    templateRequired: 'Ən azı 1 audit şablonu seçilməlidir.',
    sectionRequired: 'Ən azı 1 şablon bölməsi seçilməlidir.',
    selectedSectionsNotFound: 'Seçilmiş bölmələr tapılmadı.',
    fileUploadError: 'Fayl yüklənərkən xəta: {message}',
    planCreateError: 'Audit planı yaradılarkən xəta baş verdi.',

    planIdMissing: 'Plan ID tapılmadı.',
    questionIdMissing: 'Sual ID tapılmadı.',
    problemTitleRequired: 'Problem başlığı daxil edilməlidir.',
    findingFileUploadError: 'Fayl yüklənmədi: {message}',
    findingCreateError: 'Çatışmazlıq əlavə olunmadı: {message}',

    questionTextRequired: 'Sual mətni daxil edilməlidir.',
    planNotFound: 'Audit planı tapılmadı.',
    planNotFoundShort: 'Plan tapılmadı.',
    customQuestionLocked:
      'Bu audit redaktəyə kilidlənib. Xüsusi sual əlavə etmək mümkün deyil.',
    customQuestionCreateError: 'Xüsusi sual əlavə olunmadı: {message}',

    noAnswersToSave: 'Yadda saxlamaq üçün cavab seçilməyib.',
    templateAnswersSaveError:
      'Şablon suallarının cavabları saxlanmadı: {message}',
    customAnswerCheckError: 'Əlavə sual cavabı yoxlanarkən xəta: {message}',
    customAnswerUpdateError: 'Əlavə sual cavabı yenilənmədi: {message}',
    customAnswerInsertError: 'Əlavə sual cavabı əlavə olunmadı: {message}',
    planResultUpdateError:
      'Cavablar saxlandı, amma plan nəticəsi yenilənmədi: {message}',
    answerSaveError: 'Cavabları saxlayarkən xəta baş verdi.',

    answerCheckError: 'Audit cavabları yoxlanarkən xəta: {message}',
    completeRequiresAnswers:
      'Auditi tamamlamaq üçün əvvəlcə cavabları yadda saxlayın.',
    completeAuditError: 'Auditi tamamlamaq mümkün olmadı: {message}',

    findingIdMissing: 'Finding ID tapılmadı.',
    statusMissing: 'Status seçilməyib.',
    findingStatusUpdateError:
      'Çatışmazlıq statusu yenilənmədi: {message}',

    planDeleteNoPermission:
      'Audit planı tapılmadı və ya silmək icazəniz yoxdur.',
    planDeleteError: 'Audit planı silinərkən xəta baş verdi.',

    checkReadyRequiresAnswers:
      'Audit tamamlanması üçün əvvəlcə cavabları seçib “Cavabları Yadda Saxla” düyməsinə basın.',

    onlyAdminOrCreatorCanLock:
      'Bu planı yalnız admin və ya planı yaradan istifadəçi kilidləyə bilər.',
    lockUpdateError: 'Plan kilidi yenilənmədi: {message}',

    userSelectMissing: 'İstifadəçi seçilməyib.',
    onlyAdminOrCreatorCanAddViewer:
      'Əlavə baxış icazəsini yalnız admin və ya planı yaradan verə bilər.',
    viewerAddError: 'Baxış icazəsi əlavə olunmadı: {message}',
    onlyAdminOrCreatorCanRemoveViewer:
      'Baxış icazəsini yalnız admin və ya planı yaradan silə bilər.',
    viewerRemoveError: 'Baxış icazəsi silinmədi: {message}',

    findingIdAzeriMissing: 'Çatışmazlıq ID tapılmadı.',
    lockedPlanCannotDeleteFinding:
      'Bu plan kilidlidir. Çatışmazlıq silmək mümkün deyil.',
    findingNotFound: 'Çatışmazlıq tapılmadı.',
    findingDeleteError: 'Çatışmazlıq silinmədi: {message}',
    findingDeleteRlsError:
      'Çatışmazlıq database-dən silinmədi. Böyük ehtimalla Supabase RLS DELETE icazəsi yoxdur.',

    filePathMissing: 'Fayl yolu tapılmadı.',
    lockedPlanCannotDeleteFile:
      'Bu plan kilidlidir. Fayl silmək mümkün deyil.',
    fileNotFoundInFinding: 'Fayl çatışmazlıqda tapılmadı.',
    findingFileListUpdateError:
      'Çatışmazlıq fayl siyahısı yenilənmədi: {message}',

    onlyAdminOrCreatorCanEditPlan:
      'Bu audit planını yalnız admin və ya planı yaradan redaktə edə bilər.',
    viewLockedCannotEdit:
      'Bu plan baxışa kilidlidir. Plan məlumatlarını redaktə etmək mümkün deyil.',
    planAnswersCheckError: 'Plan cavabları yoxlanarkən xəta: {message}',
    planEditError: 'Audit planı redaktə edilərkən xəta baş verdi.',
  },
  en: {
    profileNotFound: 'Profile was not found.',
    userNotFound: 'User was not found.',
    observerReadOnly: 'Observer has read-only access.',
    auditAssistantCompanyMissing:
      'The audit assistant does not have a company assigned. Auditors cannot be assigned.',
    auditAssistantAuditorRestriction:
      'Audit assistant can assign only auditors from their own company.',

    invalidStartDate: 'Start date is not in the correct format.',
    invalidDueDate: 'Due date is not in the correct format.',
    startAfterDue: 'Start date cannot be after the due date.',
    titleRequired: 'Plan title is required.',
    companyRequired: 'Company must be selected.',
    templateRequired: 'At least 1 audit template must be selected.',
    sectionRequired: 'At least 1 template section must be selected.',
    selectedSectionsNotFound: 'Selected sections were not found.',
    fileUploadError: 'Error uploading file: {message}',
    planCreateError: 'An error occurred while creating the audit plan.',

    planIdMissing: 'Plan ID was not found.',
    questionIdMissing: 'Question ID was not found.',
    problemTitleRequired: 'Problem title is required.',
    findingFileUploadError: 'File was not uploaded: {message}',
    findingCreateError: 'Finding was not added: {message}',

    questionTextRequired: 'Question text is required.',
    planNotFound: 'Audit plan was not found.',
    planNotFoundShort: 'Plan was not found.',
    customQuestionLocked:
      'This audit is locked for editing. Custom question cannot be added.',
    customQuestionCreateError: 'Custom question was not added: {message}',

    noAnswersToSave: 'No answer was selected to save.',
    templateAnswersSaveError:
      'Template question answers were not saved: {message}',
    customAnswerCheckError: 'Error checking custom question answer: {message}',
    customAnswerUpdateError: 'Custom question answer was not updated: {message}',
    customAnswerInsertError: 'Custom question answer was not added: {message}',
    planResultUpdateError:
      'Answers were saved, but the plan result was not updated: {message}',
    answerSaveError: 'An error occurred while saving answers.',

    answerCheckError: 'Error checking audit answers: {message}',
    completeRequiresAnswers:
      'To complete the audit, save the answers first.',
    completeAuditError: 'Audit could not be completed: {message}',

    findingIdMissing: 'Finding ID was not found.',
    statusMissing: 'Status was not selected.',
    findingStatusUpdateError: 'Finding status was not updated: {message}',

    planDeleteNoPermission:
      'Audit plan was not found or you do not have permission to delete it.',
    planDeleteError: 'An error occurred while deleting the audit plan.',

    checkReadyRequiresAnswers:
      'To complete the audit, first select answers and click “Save Answers”.',

    onlyAdminOrCreatorCanLock:
      'Only an admin or the user who created the plan can lock this plan.',
    lockUpdateError: 'Plan lock was not updated: {message}',

    userSelectMissing: 'User was not selected.',
    onlyAdminOrCreatorCanAddViewer:
      'Only an admin or the user who created the plan can grant additional view access.',
    viewerAddError: 'View access was not added: {message}',
    onlyAdminOrCreatorCanRemoveViewer:
      'Only an admin or the user who created the plan can remove view access.',
    viewerRemoveError: 'View access was not removed: {message}',

    findingIdAzeriMissing: 'Finding ID was not found.',
    lockedPlanCannotDeleteFinding:
      'This plan is locked. Finding cannot be deleted.',
    findingNotFound: 'Finding was not found.',
    findingDeleteError: 'Finding was not deleted: {message}',
    findingDeleteRlsError:
      'Finding was not deleted from the database. Most likely, Supabase RLS DELETE permission is missing.',

    filePathMissing: 'File path was not found.',
    lockedPlanCannotDeleteFile:
      'This plan is locked. File cannot be deleted.',
    fileNotFoundInFinding: 'File was not found in the finding.',
    findingFileListUpdateError:
      'Finding file list was not updated: {message}',

    onlyAdminOrCreatorCanEditPlan:
      'Only an admin or the user who created the plan can edit this audit plan.',
    viewLockedCannotEdit:
      'This plan is locked for viewing. Plan details cannot be edited.',
    planAnswersCheckError: 'Error checking plan answers: {message}',
    planEditError: 'An error occurred while editing the audit plan.',
  },
  ru: {
    profileNotFound: 'Профиль не найден.',
    userNotFound: 'Пользователь не найден.',
    observerReadOnly: 'Наблюдатель имеет только право просмотра.',
    auditAssistantCompanyMissing:
      'У помощника аудитора не назначена компания. Невозможно назначить аудиторов.',
    auditAssistantAuditorRestriction:
      'Помощник аудитора может назначать только аудиторов своей компании.',

    invalidStartDate: 'Дата начала указана в неверном формате.',
    invalidDueDate: 'Срок указан в неверном формате.',
    startAfterDue: 'Дата начала не может быть позже срока.',
    titleRequired: 'Необходимо указать название плана.',
    companyRequired: 'Необходимо выбрать компанию.',
    templateRequired: 'Необходимо выбрать минимум 1 шаблон аудита.',
    sectionRequired: 'Необходимо выбрать минимум 1 раздел шаблона.',
    selectedSectionsNotFound: 'Выбранные разделы не найдены.',
    fileUploadError: 'Ошибка загрузки файла: {message}',
    planCreateError: 'При создании плана аудита произошла ошибка.',

    planIdMissing: 'ID плана не найден.',
    questionIdMissing: 'ID вопроса не найден.',
    problemTitleRequired: 'Необходимо указать заголовок проблемы.',
    findingFileUploadError: 'Файл не был загружен: {message}',
    findingCreateError: 'Замечание не было добавлено: {message}',

    questionTextRequired: 'Необходимо указать текст вопроса.',
    planNotFound: 'План аудита не найден.',
    planNotFoundShort: 'План не найден.',
    customQuestionLocked:
      'Этот аудит заблокирован для редактирования. Невозможно добавить пользовательский вопрос.',
    customQuestionCreateError: 'Пользовательский вопрос не был добавлен: {message}',

    noAnswersToSave: 'Не выбраны ответы для сохранения.',
    templateAnswersSaveError:
      'Ответы на вопросы шаблона не были сохранены: {message}',
    customAnswerCheckError:
      'Ошибка при проверке ответа на дополнительный вопрос: {message}',
    customAnswerUpdateError:
      'Ответ на дополнительный вопрос не был обновлен: {message}',
    customAnswerInsertError:
      'Ответ на дополнительный вопрос не был добавлен: {message}',
    planResultUpdateError:
      'Ответы сохранены, но результат плана не был обновлен: {message}',
    answerSaveError: 'При сохранении ответов произошла ошибка.',

    answerCheckError: 'Ошибка проверки ответов аудита: {message}',
    completeRequiresAnswers:
      'Чтобы завершить аудит, сначала сохраните ответы.',
    completeAuditError: 'Не удалось завершить аудит: {message}',

    findingIdMissing: 'ID замечания не найден.',
    statusMissing: 'Статус не выбран.',
    findingStatusUpdateError: 'Статус замечания не был обновлен: {message}',

    planDeleteNoPermission:
      'План аудита не найден или у вас нет разрешения на его удаление.',
    planDeleteError: 'При удалении плана аудита произошла ошибка.',

    checkReadyRequiresAnswers:
      'Для завершения аудита сначала выберите ответы и нажмите “Сохранить ответы”.',

    onlyAdminOrCreatorCanLock:
      'Заблокировать этот план может только администратор или пользователь, создавший план.',
    lockUpdateError: 'Блокировка плана не была обновлена: {message}',

    userSelectMissing: 'Пользователь не выбран.',
    onlyAdminOrCreatorCanAddViewer:
      'Дополнительный доступ к просмотру может предоставить только администратор или пользователь, создавший план.',
    viewerAddError: 'Доступ к просмотру не был добавлен: {message}',
    onlyAdminOrCreatorCanRemoveViewer:
      'Удалить доступ к просмотру может только администратор или пользователь, создавший план.',
    viewerRemoveError: 'Доступ к просмотру не был удален: {message}',

    findingIdAzeriMissing: 'ID замечания не найден.',
    lockedPlanCannotDeleteFinding:
      'Этот план заблокирован. Невозможно удалить замечание.',
    findingNotFound: 'Замечание не найдено.',
    findingDeleteError: 'Замечание не было удалено: {message}',
    findingDeleteRlsError:
      'Замечание не было удалено из базы данных. Скорее всего, отсутствует разрешение Supabase RLS DELETE.',

    filePathMissing: 'Путь к файлу не найден.',
    lockedPlanCannotDeleteFile:
      'Этот план заблокирован. Невозможно удалить файл.',
    fileNotFoundInFinding: 'Файл не найден в замечании.',
    findingFileListUpdateError:
      'Список файлов замечания не был обновлен: {message}',

    onlyAdminOrCreatorCanEditPlan:
      'Редактировать этот план аудита может только администратор или пользователь, создавший план.',
    viewLockedCannotEdit:
      'Этот план заблокирован для просмотра. Невозможно редактировать данные плана.',
    planAnswersCheckError: 'Ошибка проверки ответов плана: {message}',
    planEditError: 'При редактировании плана аудита произошла ошибка.',
  },
} as const

function getLocale(value?: FormDataEntryValue | string | null): Locale {
  if (value === 'en' || value === 'ru' || value === 'az') return value
  return 'az'
}

function tr(
  locale: Locale,
  key: keyof typeof I18N.az,
  vars?: Record<string, any>
): string {
  let text: string = I18N[locale][key]

  for (const [name, value] of Object.entries(vars || {})) {
    text = text.replaceAll(`{${name}}`, String(value))
  }

  return text
}

async function getCurrentUserProfile(
  supabase: any,
  userId: string,
  locale: Locale = 'az'
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return {
      profile: null,
      error: error.message,
    }
  }

  if (!profile) {
    return {
      profile: null,
      error: tr(locale, 'profileNotFound'),
    }
  }

  return {
    profile: {
      role: String(profile.role || '').toLowerCase(),
      company_id: profile.company_id || null,
    },
    error: null,
  }
}

async function validateAuditMuaviniAssignments(
  supabase: any,
  currentUserId: string,
  assignedIds: string[],
  locale: Locale = 'az'
) {
  const current = await getCurrentUserProfile(supabase, currentUserId, locale)

  if (current.error) {
    return { error: current.error }
  }

  const role = current.profile?.role
  const companyId = current.profile?.company_id

  if (role !== 'audit_muavini') {
    return { error: null }
  }

  const uniqueAssignedIds = Array.from(new Set(assignedIds.filter(Boolean)))

  if (uniqueAssignedIds.length === 0) {
    return { error: null }
  }

  if (!companyId) {
    return {
      error: tr(locale, 'auditAssistantCompanyMissing'),
    }
  }

  const { data: allowedAuditors, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'auditor')
    .eq('company_id', companyId)
    .in('id', uniqueAssignedIds)

  if (error) {
    return { error: error.message }
  }

  const allowedIds = new Set((allowedAuditors || []).map((item: any) => item.id))
  const invalidAssignedIds = uniqueAssignedIds.filter((id) => !allowedIds.has(id))

  if (invalidAssignedIds.length > 0) {
    return {
      error: tr(locale, 'auditAssistantAuditorRestriction'),
    }
  }

  return { error: null }
}

function observerReadOnlyError(locale: Locale = 'az'): ActionState {
  return {
    error: tr(locale, 'observerReadOnly'),
    success: false,
  }
}

async function getCurrentProfileRole(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { role: null, error: error.message }
  }

  return {
    role: String(profile?.role || '').toLowerCase(),
    error: null,
  }
}

function isObserverRole(role: string | null) {
  return role === 'musahideci'
}


// --- 1. Audit Planı Yaratma ---
export async function createAuditPlan(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(formData.get('locale'))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: tr(locale, 'userNotFound'), success: false }
  const currentRole = await getCurrentProfileRole(supabase, user.id)

  if (currentRole.error) {
    return { error: currentRole.error, success: false }
  }

  if (isObserverRole(currentRole.role)) {
    return observerReadOnlyError(locale)
  }
  const title = String(formData.get('title') || '').trim()
  const companyId = String(formData.get('company_id') || '')
  const templateIds = formData.getAll('template_ids') as string[]
  const selectedSectionIds = formData.getAll('template_section_ids') as string[]
  const templateId = templateIds[0] || ''
  const dueDate = String(formData.get('due_date') || '')
  const startDate = String(formData.get('start_date') || '')
  const notes = String(formData.get('notes') || '')
  const department = String(formData.get('department') || '')

  const validStartDate =
    !startDate || /^\d{4}-\d{2}-\d{2}$/.test(startDate)

  const validDueDate =
    !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)

  if (!validStartDate) {
    return { error: tr(locale, 'invalidStartDate'), success: false }
  }

  if (!validDueDate) {
    return { error: tr(locale, 'invalidDueDate'), success: false }
  }

  if (startDate && dueDate && startDate > dueDate) {
    return { error: tr(locale, 'startAfterDue'), success: false }
  }

  if (!title) {
    return { error: tr(locale, 'titleRequired'), success: false }
  }

  if (!companyId) {
    return { error: tr(locale, 'companyRequired'), success: false }
  }

  if (templateIds.length === 0) {
    return { error: tr(locale, 'templateRequired'), success: false }
  }

  if (selectedSectionIds.length === 0) {
    return { error: tr(locale, 'sectionRequired'), success: false }
  }


  const assignedIds = formData.getAll('assigned_to') as string[]

  const assignmentValidation = await validateAuditMuaviniAssignments(
    supabase,
    user.id,
    assignedIds,
    locale
  )

  if (assignmentValidation.error) {
    return { error: assignmentValidation.error, success: false }
  }

  let fileUrl: string | null = null
  const file = formData.get('file') as File | null

  try {
    if (file && file.size > 0) {
      const safeName = sanitizeFilename(file.name)
      const fileName = `${Date.now()}_${safeName}`
      const filePath = `plans/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audit-docs')
        .upload(filePath, file)

      if (uploadError) {
        return {
          error: tr(locale, 'fileUploadError', { message: uploadError.message }),
          success: false,
        }
      }

      fileUrl = filePath
    }

    const { data: plan, error: planError } = await supabase
      .from('audit_plans')
      .insert([
        {
          title,
          department: department || null,
          company_id: companyId,
          template_id: templateId,
          due_date: dueDate || null,
          start_date: startDate || null,
          notes,
          file_url: fileUrl,
          created_by: user.id,
          status: 'planlanan',
          score: 0,
        },
      ])
      .select()
      .single()

    if (planError) throw planError

    const uniqueTemplateIds = Array.from(new Set(templateIds.filter(Boolean)))

    const planTemplates = uniqueTemplateIds.map((id) => ({
      plan_id: plan.id,
      template_id: id,
    }))

    const uniqueSectionPairs = Array.from(
      new Set(selectedSectionIds.filter(Boolean))
    )

    const planTemplateSections = uniqueSectionPairs
      .map((value) => {
        const [template_id, section_id] = String(value).split(':')

        if (!template_id || !section_id) return null
        if (!uniqueTemplateIds.includes(template_id)) return null

        return {
          plan_id: plan.id,
          template_id,
          section_id,
        }
      })
      .filter(Boolean)

    if (planTemplateSections.length === 0) {
      throw new Error(tr(locale, 'selectedSectionsNotFound'))
    }



    const assignmentValidationAfterPlanCreate =
      await validateAuditMuaviniAssignments(
        supabase,
        user.id,
        assignedIds,
        locale
      )

    if (assignmentValidationAfterPlanCreate.error) {
      throw new Error(assignmentValidationAfterPlanCreate.error)
    }

    const assignments = Array.from(new Set(assignedIds.filter(Boolean))).map(
      (id) => ({
        plan_id: plan.id,
        user_id: id,
      })
    )

    const insertTasks = [
      supabase.from('audit_plan_templates').insert(planTemplates),
      supabase.from('audit_plan_template_sections').insert(planTemplateSections),
    ]

    if (assignments.length > 0) {
      insertTasks.push(supabase.from('plan_assignments').insert(assignments))
    }

    const [planTemplatesResult, planTemplateSectionsResult, assignmentsResult] =
      await Promise.all(insertTasks)

    if (planTemplatesResult.error) {
      throw planTemplatesResult.error
    }

    if (planTemplateSectionsResult.error) {
      throw planTemplateSectionsResult.error
    }

    if (assignmentsResult?.error) {
      throw assignmentsResult.error
    }

    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    if (fileUrl) {
      await supabase.storage.from('audit-docs').remove([fileUrl])
    }

    return {
      error: err.message || tr(locale, 'planCreateError'),
      success: false,
    }
  }
}

// --- 2. çatışmazlıq (Finding) Əlavə Etmə ---
export async function addFinding(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(formData.get('locale'))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: tr(locale, 'userNotFound'), success: false }
  }
  const currentRole = await getCurrentProfileRole(supabase, user.id)

  if (currentRole.error) {
    return { error: currentRole.error, success: false }
  }

  if (isObserverRole(currentRole.role)) {
    return observerReadOnlyError(locale)
  }
  const planId = String(formData.get('plan_id') || '')
  const questionId = String(formData.get('question_id') || '')
  const questionType = String(formData.get('question_type') || 'template')
  const assignedTo = String(formData.get('assigned_to') || '')
  const title = String(formData.get('title') || '').trim()
  const severity = String(formData.get('severity') || 'low')
  const description = String(formData.get('description') || '').trim()
  const deadline = String(formData.get('deadline') || '').trim()

  if (!planId) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  if (!questionId) {
    return { error: tr(locale, 'questionIdMissing'), success: false }
  }

  if (!title) {
    return { error: tr(locale, 'problemTitleRequired'), success: false }
  }

  const uploadedFiles: {
    name: string
    path: string
    size: number
    type: string
  }[] = []

  const files = formData
    .getAll('files')
    .filter((file): file is File => file instanceof File && file.size > 0)

  for (const file of files) {
    const safeName = file.name
      .replace(/[^\w.\-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 120)

    const filePath = `${planId}/${questionId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('finding-files')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return {
        error: tr(locale, 'findingFileUploadError', { message: uploadError.message }),
        success: false,
      }
    }

    uploadedFiles.push({
      name: file.name,
      path: filePath,
      size: file.size,
      type: file.type || 'application/octet-stream',
    })
  }

  const { error } = await supabase.from('findings').insert([
    {
      plan_id: planId,
      question_id: questionType === 'custom' ? null : questionId,
      custom_question_id: questionType === 'custom' ? questionId : null,
      assigned_to: assignedTo || null,
      title,
      severity,
      description,
      deadline: deadline || null,
      status: 'aciq',
      files: uploadedFiles,
    },
  ])

  if (error) {
    if (uploadedFiles.length > 0) {
      await supabase.storage
        .from('finding-files')
        .remove(uploadedFiles.map((file) => file.path))
    }

    return {
  error: tr(locale, 'findingCreateError', { message: error.message }),
  success: false,
}
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)

  return { error: null, success: true }
}


// --- 2.1. Auditor tərəfindən plana xüsusi sual əlavə et ---
export async function addCustomQuestion(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(formData.get('locale'))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: tr(locale, 'userNotFound'), success: false }
  }
  const currentRole = await getCurrentProfileRole(supabase, user.id)

  if (currentRole.error) {
    return { error: currentRole.error, success: false }
  }

  if (isObserverRole(currentRole.role)) {
    return observerReadOnlyError(locale)
  }
  const planId = String(formData.get('plan_id') || '').trim()
  const questionText = String(formData.get('question_text') || '').trim()
  const rawMaxScore = String(formData.get('max_score') || '10').trim()

  if (!planId) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  if (!questionText) {
    return { error: tr(locale, 'questionTextRequired'), success: false }
  }

  let maxScore = Number(rawMaxScore || 10)

  if (Number.isNaN(maxScore) || maxScore <= 0) {
    maxScore = 10
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, locked_edit')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: tr(locale, 'planNotFound'), success: false }
  }

  if (plan.locked_edit) {
    return {
      error: tr(locale, 'customQuestionLocked'),
      success: false,
    }
  }

  const { error } = await supabase.from('audit_custom_questions').insert([
    {
      plan_id: planId,
      question_text: questionText,
      max_score: maxScore,
      created_by: user.id,
    },
  ])

  if (error) {
    return {
      error: tr(locale, 'customQuestionCreateError', { message: error.message }),
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
}

// --- 3. Audit Cavablarını Yadda Saxlama ---
// --- 3. Audit Cavablarını Yadda Saxlama ---
export async function saveAuditAnswers(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(formData.get('locale'))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: tr(locale, 'userNotFound'), success: false }
  }

  const currentRole = await getCurrentProfileRole(supabase, user.id)

  if (currentRole.error) {
    return { error: currentRole.error, success: false }
  }

  if (isObserverRole(currentRole.role)) {
    return observerReadOnlyError(locale)
  }

  const plan_id = formData.get('plan_id') as string

  if (!plan_id) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  try {
    const templateAnswers: any[] = []
    const customAnswers: any[] = []
    const incomingQuestionIds: string[] = []
    const incomingCustomQuestionIds: string[] = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('answer_custom_')) {
        const custom_question_id = key.replace('answer_custom_', '')
        const response = String(value || '')
        const comment = String(
          formData.get(`comment_custom_${custom_question_id}`) || ''
        )
        const rawScore = formData.get(`score_custom_${custom_question_id}`)

        incomingCustomQuestionIds.push(custom_question_id)

        customAnswers.push({
          plan_id,
          custom_question_id,
          response,
          comment,
          rawScore,
          updated_at: new Date().toISOString(),
        })

        continue
      }

      if (key.startsWith('answer_')) {
        const question_id = key.replace('answer_', '')
        const response = String(value || '')
        const comment = String(formData.get(`comment_${question_id}`) || '')
        const rawScore = formData.get(`score_${question_id}`)

        incomingQuestionIds.push(question_id)

        templateAnswers.push({
          plan_id,
          question_id,
          response,
          comment,
          rawScore,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (templateAnswers.length === 0 && customAnswers.length === 0) {
      return {
        error: tr(locale, 'noAnswersToSave'),
        success: false,
      }
    }

    let incomingQuestions: any[] = []

    if (incomingQuestionIds.length > 0) {
      const { data, error: incomingQuestionsError } = await supabase
        .from('template_questions')
        .select('id, max_score')
        .in('id', incomingQuestionIds)

      if (incomingQuestionsError) throw incomingQuestionsError

      incomingQuestions = data || []
    }

    const incomingMaxScoreMap = new Map(
      incomingQuestions.map((q: any) => [q.id, Number(q.max_score || 10)])
    )

    const templateAnswersWithScore = templateAnswers.map((answer) => {
      const maxScore = incomingMaxScoreMap.get(answer.question_id) || 10

      let score = Number(answer.rawScore || 0)

      if (Number.isNaN(score)) score = 0
      if (score < 0) score = 0
      if (score > maxScore) score = maxScore
      if (answer.response === 'na') score = 0

      return {
        plan_id: answer.plan_id,
        question_id: answer.question_id,
        custom_question_id: null,
        response: answer.response,
        comment: answer.comment,
        score,
        updated_at: answer.updated_at,
      }
    })

    let incomingCustomQuestions: any[] = []

    if (incomingCustomQuestionIds.length > 0) {
      const { data, error: incomingCustomQuestionsError } = await supabase
        .from('audit_custom_questions')
        .select('id, max_score')
        .eq('plan_id', plan_id)
        .in('id', incomingCustomQuestionIds)

      if (incomingCustomQuestionsError) throw incomingCustomQuestionsError

      incomingCustomQuestions = data || []
    }

    const incomingCustomMaxScoreMap = new Map(
      incomingCustomQuestions.map((q: any) => [
        q.id,
        Number(q.max_score || 10),
      ])
    )

    const customAnswersWithScore = customAnswers.map((answer) => {
      const maxScore =
        incomingCustomMaxScoreMap.get(answer.custom_question_id) || 10

      let score = Number(answer.rawScore || 0)

      if (Number.isNaN(score)) score = 0
      if (score < 0) score = 0
      if (score > maxScore) score = maxScore
      if (answer.response === 'na') score = 0

      return {
        plan_id: answer.plan_id,
        question_id: null,
        custom_question_id: answer.custom_question_id,
        response: answer.response,
        comment: answer.comment,
        score,
        updated_at: answer.updated_at,
      }
    })

    if (templateAnswersWithScore.length > 0) {
      const { error: upsertTemplateError } = await supabase
        .from('audit_answers')
        .upsert(templateAnswersWithScore, {
          onConflict: 'plan_id,question_id',
        })

      if (upsertTemplateError) {
        return {
          error: tr(locale, 'templateAnswersSaveError', {
            message: upsertTemplateError.message,
          }),
          success: false,
        }
      }
    }

    if (customAnswersWithScore.length > 0) {
      for (const answer of customAnswersWithScore) {
        const { data: existingCustomAnswer, error: findCustomError } = await supabase
          .from('audit_answers')
          .select('id')
          .eq('plan_id', answer.plan_id)
          .eq('custom_question_id', answer.custom_question_id)
          .maybeSingle()

        if (findCustomError) {
          return {
            error: tr(locale, 'customAnswerCheckError', {
              message: findCustomError.message,
            }),
            success: false,
          }
        }

        if (existingCustomAnswer?.id) {
          const { error: updateCustomError } = await supabase
            .from('audit_answers')
            .update({
              response: answer.response,
              comment: answer.comment,
              score: answer.score,
              updated_at: answer.updated_at,
            })
            .eq('id', existingCustomAnswer.id)

          if (updateCustomError) {
            return {
              error: tr(locale, 'customAnswerUpdateError', {
                message: updateCustomError.message,
              }),
              success: false,
            }
          }
        } else {
          const { error: insertCustomError } = await supabase
            .from('audit_answers')
            .insert([
              {
                plan_id: answer.plan_id,
                question_id: null,
                custom_question_id: answer.custom_question_id,
                response: answer.response,
                comment: answer.comment,
                score: answer.score,
                updated_at: answer.updated_at,
              },
            ])

          if (insertCustomError) {
            return {
              error: tr(locale, 'customAnswerInsertError', {
                message: insertCustomError.message,
              }),
              success: false,
            }
          }
        }
      }
    }

    const { data: allAnswers, error: allAnswersError } = await supabase
      .from('audit_answers')
      .select(`
        question_id,
        custom_question_id,
        response,
        score,
        template_questions(max_score),
        audit_custom_questions(max_score)
      `)
      .eq('plan_id', plan_id)

    if (allAnswersError) throw allAnswersError

    const scoredAnswers = (allAnswers || []).filter(
      (answer: any) => answer.response !== 'na'
    )

    const earnedScore = scoredAnswers.reduce((sum: number, answer: any) => {
      return sum + Number(answer.score || 0)
    }, 0)

    const possibleScore = scoredAnswers.reduce((sum: number, answer: any) => {
      const templateQuestion = Array.isArray(answer.template_questions)
        ? answer.template_questions[0] || null
        : answer.template_questions || null

      const customQuestion = Array.isArray(answer.audit_custom_questions)
        ? answer.audit_custom_questions[0] || null
        : answer.audit_custom_questions || null

      const maxScore =
        templateQuestion?.max_score ?? customQuestion?.max_score ?? 10

      return sum + Number(maxScore || 10)
    }, 0)

    const finalScore =
      possibleScore > 0 ? Math.round((earnedScore / possibleScore) * 100) : 0

    const nextStatus = finalScore >= 50 ? 'tamamlandi' : 'needs_attention'

    const { error: planUpdateError } = await supabase
      .from('audit_plans')
      .update({
        score: finalScore,
        status: nextStatus,
      })
      .eq('id', plan_id)

    if (planUpdateError) {
      return {
        error: tr(locale, 'planResultUpdateError', {
          message: planUpdateError.message,
        }),
        success: false,
      }
    }

    revalidatePath(`/dashboard/plans/${plan_id}/fill`)
    revalidatePath(`/dashboard/plans/${plan_id}`)
    revalidatePath(`/dashboard/plans/${plan_id}/report`)
    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard/findings')
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    return {
      error: err.message || tr(locale, 'answerSaveError'),
      success: false,
    }
  }
}

// --- 4. Auditi Tamamla ---
export async function completeAudit(
  planId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: tr(locale, 'userNotFound'), success: false }
  }

  const currentRole = await getCurrentProfileRole(supabase, user.id)

  if (currentRole.error) {
    return { error: currentRole.error, success: false }
  }

  if (isObserverRole(currentRole.role)) {
    return observerReadOnlyError(locale)
  }
  if (!planId) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  const { data: answers, error: answersError } = await supabase
    .from('audit_answers')
    .select('score')
    .eq('plan_id', planId)

  if (answersError) {
    return {
      error: tr(locale, 'answerCheckError', { message: answersError.message }),
      success: false,
    }
  }

  if (!answers || answers.length === 0) {
    return {
      error: tr(locale, 'completeRequiresAnswers'),
      success: false,
    }
  }

  const totalScore = answers.reduce(
    (sum: number, item: any) => sum + Number(item.score || 0),
    0
  )

  const averageScore = Math.round(totalScore / answers.length)
  const status = averageScore < 50 ? 'needs_attention' : 'tamamlandi'

  const { error } = await supabase
    .from('audit_plans')
    .update({
      status,
      score: averageScore,
    })
    .eq('id', planId)

  if (error) {
    return {
      error: tr(locale, 'completeAuditError', { message: error.message }),
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

// --- 5. Finding status yenilə ---
export async function updateFindingStatus(
  findingId: string,
  status: string,
  planId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!findingId) {
    return {error: tr(locale, 'findingIdMissing'), success: false}
  }

  if (!status) {
    return {error: tr(locale, 'statusMissing'), success: false}
  }

  const {data: {user}} = await supabase.auth.getUser()

  if (!user) {
    return {error: tr(locale, 'userNotFound'), success: false}
  }

  const {data: profile} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (String(profile?.role || '').toLowerCase() === 'musahideci') {
    return observerReadOnlyError(locale)
  }

  const {error} = await supabase
    .from('findings')
    .update({status})
    .eq('id', findingId)

  if (error) {
    return {
      error: tr(locale, 'findingStatusUpdateError', {message: error.message}),
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)
  revalidatePath('/dashboard/findings')

  return {error: null, success: true}
}

// --- 6. Audit Planı Sil ---
export async function deleteAuditPlan(
  planId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!planId) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  try {
    const { data: plan, error: planFetchError } = await supabase
      .from('audit_plans')
      .select('id, file_url')
      .eq('id', planId)
      .maybeSingle()

    if (planFetchError) throw planFetchError

    if (!plan) {
      return {
        error: tr(locale, 'planDeleteNoPermission'),
        success: false,
      }
    }

    const { error: planError } = await supabase
      .from('audit_plans')
      .delete()
      .eq('id', planId)

    if (planError) throw planError

    if (plan.file_url) {
      supabase.storage.from('audit-docs').remove([plan.file_url]).then(({ error }) => {
        if (error) {
          console.error('Audit faylı storage-dən silinmədi:', error.message)
        }
      })
    }

    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    return {
      error: err.message || tr(locale, 'planDeleteError'),
      success: false,
    }
  }
}


// --- 7. Audit tamamlanma yoxlaması ---
export async function checkAuditReady(
  planId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!planId) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  const { data: answers, error } = await supabase
    .from('audit_answers')
    .select('id')
    .eq('plan_id', planId)
    .limit(1)

  if (error) {
    return {
      error: tr(locale, 'answerCheckError', { message: error.message }),
      success: false,
    }
  }

  if (!answers || answers.length === 0) {
    return {
      error: tr(locale, 'checkReadyRequiresAnswers'),
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

export async function updateAuditPlanLock(
  planId: string,
  lockType: 'none' | 'edit' | 'view',
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: tr(locale, 'userNotFound'), success: false }
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by')
    .eq('id', planId)
    .maybeSingle()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message, success: false }
  }

  if (String(profile?.role || '').toLowerCase() === 'musahideci') {
    return observerReadOnlyError(locale)
  }

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: tr(locale, 'planNotFoundShort'), success: false }
  }

  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: tr(locale, 'onlyAdminOrCreatorCanLock'),
      success: false,
    }
  }

  const payload =
    lockType === 'none'
      ? {
          locked_edit: false,
          locked_view: false,
          locked_by: null,
          locked_at: null,
        }
      : lockType === 'edit'
        ? {
            locked_edit: true,
            locked_view: false,
            locked_by: user.id,
            locked_at: new Date().toISOString(),
          }
        : {
            locked_edit: true,
            locked_view: true,
            locked_by: user.id,
            locked_at: new Date().toISOString(),
          }

  const { error } = await supabase
    .from('audit_plans')
    .update(payload)
    .eq('id', planId)

  if (error) {
    return {
      error: tr(locale, 'lockUpdateError', { message: error.message }),
      success: false,
    }
  }

  revalidatePath('/dashboard/plans')
  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)

  return { error: null, success: true }
}

export async function addPlanViewer(
  planId: string,
  userId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!planId) {
    return {error: tr(locale, 'planIdMissing'), success: false}
  }

  if (!userId) {
    return {error: tr(locale, 'userSelectMissing'), success: false}
  }

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return {error: tr(locale, 'userNotFound'), success: false}
  }

  const {data: plan, error: planError} = await supabase
    .from('audit_plans')
    .select('id, created_by')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return {error: planError.message, success: false}
  }

  if (!plan) {
    return {error: tr(locale, 'planNotFoundShort'), success: false}
  }

  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {error: profileError.message, success: false}
  }

  if (String(profile?.role || '').toLowerCase() === 'musahideci') {
    return observerReadOnlyError(locale)
  }

  const isAdmin = String(profile?.role || '').toLowerCase() === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: tr(locale, 'onlyAdminOrCreatorCanAddViewer'),
      success: false,
    }
  }

  const {error} = await supabase
    .from('audit_plan_viewers')
    .upsert(
      {
        plan_id: planId,
        user_id: userId,
      },
      {onConflict: 'plan_id,user_id'}
    )

  if (error) {
    return {
      error: tr(locale, 'viewerAddError', {message: error.message}),
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath('/dashboard/plans')

  return {error: null, success: true}
}

export async function removePlanViewer(
  planId: string,
  userId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!planId) {
    return {error: tr(locale, 'planIdMissing'), success: false}
  }

  if (!userId) {
    return {error: tr(locale, 'userSelectMissing'), success: false}
  }

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return {error: tr(locale, 'userNotFound'), success: false}
  }

  const {data: plan, error: planError} = await supabase
    .from('audit_plans')
    .select('id, created_by')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return {error: planError.message, success: false}
  }

  if (!plan) {
    return {error: tr(locale, 'planNotFoundShort'), success: false}
  }

  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {error: profileError.message, success: false}
  }

  if (String(profile?.role || '').toLowerCase() === 'musahideci') {
    return observerReadOnlyError(locale)
  }

  const isAdmin = String(profile?.role || '').toLowerCase() === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
    return {
      error: tr(locale, 'onlyAdminOrCreatorCanRemoveViewer'),
      success: false,
    }
  }

  const {error} = await supabase
    .from('audit_plan_viewers')
    .delete()
    .eq('plan_id', planId)
    .eq('user_id', userId)

  if (error) {
    return {
      error: tr(locale, 'viewerRemoveError', {message: error.message}),
      success: false,
    }
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath('/dashboard/plans')

  return {error: null, success: true}
}

export async function deleteFinding(
  findingId: string,
  planId: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!findingId) {
    return { error: tr(locale, 'findingIdAzeriMissing'), success: false }
  }

  if (!planId) {
    return { error: tr(locale, 'planIdMissing'), success: false }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: tr(locale, 'userNotFound'), success: false }
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by, locked_edit, locked_view')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

  if (!plan) {
    return { error: tr(locale, 'planNotFound'), success: false }
  }

  if (plan.locked_edit || plan.locked_view) {
    return {
      error: tr(locale, 'lockedPlanCannotDeleteFinding'),
      success: false,
    }
  }

  const { data: finding, error: findingError } = await supabase
    .from('findings')
    .select('id, files')
    .eq('id', findingId)
    .eq('plan_id', planId)
    .maybeSingle()

  if (findingError) {
    return { error: findingError.message, success: false }
  }

  if (!finding) {
    return { error: tr(locale, 'findingNotFound'), success: false }
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from('findings')
    .delete()
    .eq('id', findingId)
    .eq('plan_id', planId)
    .select('id')

  if (deleteError) {
    return {
      error: tr(locale, 'findingDeleteError', { message: deleteError.message }),
      success: false,
    }
  }

  if (!deletedRows || deletedRows.length === 0) {
    return {
      error: tr(locale, 'findingDeleteRlsError'),
      success: false,
    }
  }

  const filePaths = Array.isArray((finding as any).files)
    ? (finding as any).files
        .map((file: any) => file?.path)
        .filter(Boolean)
    : []

  if (filePaths.length > 0) {
    supabase.storage
      .from('finding-files')
      .remove(filePaths)
      .then(({ error }) => {
        if (error) {
          console.error('Çatışmazlıq faylları storage-dən silinmədi:', error.message)
        }
      })
  }

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)
  revalidatePath('/dashboard/plans')
  revalidatePath('/dashboard/findings')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

export async function deleteFindingFile(
  findingId: string,
  planId: string,
  filePath: string,
  localeInput?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(localeInput)

  if (!findingId) {
    return {error: tr(locale, 'findingIdAzeriMissing'), success: false}
  }

  if (!planId) {
    return {error: tr(locale, 'planIdMissing'), success: false}
  }

  if (!filePath) {
    return {error: tr(locale, 'filePathMissing'), success: false}
  }

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) {
    return {error: tr(locale, 'userNotFound'), success: false}
  }

  const {data: plan, error: planError} = await supabase
    .from('audit_plans')
    .select('id, locked_edit, locked_view')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return {error: planError.message, success: false}
  }

  if (!plan) {
    return {error: tr(locale, 'planNotFound'), success: false}
  }

  if (plan.locked_edit || plan.locked_view) {
    return {error: tr(locale, 'lockedPlanCannotDeleteFile'), success: false}
  }

  const {data: finding, error: findingError} = await supabase
    .from('findings')
    .select('id, files')
    .eq('id', findingId)
    .eq('plan_id', planId)
    .maybeSingle()

  if (findingError) {
    return {error: findingError.message, success: false}
  }

  if (!finding) {
    return {error: tr(locale, 'findingNotFound'), success: false}
  }

  const files = Array.isArray((finding as any).files)
    ? (finding as any).files
    : []

  const nextFiles = files.filter((file: any) => file?.path !== filePath)

  if (nextFiles.length === files.length) {
    return {error: tr(locale, 'fileNotFoundInFinding'), success: false}
  }

  const {error: updateError} = await supabase
    .from('findings')
    .update({files: nextFiles})
    .eq('id', findingId)
    .eq('plan_id', planId)

  if (updateError) {
    return {
      error: tr(locale, 'findingFileListUpdateError', {
        message: updateError.message,
      }),
      success: false,
    }
  }

  supabase.storage
    .from('finding-files')
    .remove([filePath])
    .then(({error}) => {
      if (error) {
        console.error('Çatışmazlıq faylı storage-dən silinmədi:', error.message)
      }
    })

  revalidatePath(`/dashboard/plans/${planId}`)
  revalidatePath(`/dashboard/plans/${planId}/fill`)
  revalidatePath(`/dashboard/plans/${planId}/report`)
  revalidatePath('/dashboard/findings')

  return {error: null, success: true}
}

export async function updateAuditPlan(
  planId: string,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const locale = getLocale(formData.get('locale'))

  if (!planId) {
  return { error: tr(locale, 'planIdMissing'), success: false }
}

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
  return { error: tr(locale, 'userNotFound'), success: false }
}

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select('id, created_by, file_url, locked_edit, locked_view')
    .eq('id', planId)
    .maybeSingle()

  if (planError) {
    return { error: planError.message, success: false }
  }

 if (!plan) {
  return { error: tr(locale, 'planNotFound'), success: false }
}

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message, success: false }
  }
  if (String(profile?.role || '').toLowerCase() === 'musahideci') {
    return observerReadOnlyError(locale)
  }
  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id

  if (!isAdmin && !isCreator) {
  return {
    error: tr(locale, 'onlyAdminOrCreatorCanEditPlan'),
    success: false,
  }
}

  if (plan.locked_view) {
    return {
      error: tr(locale, 'viewLockedCannotEdit'),
      success: false,
    }
  }

  const title = String(formData.get('title') || '').trim()
  const companyId = String(formData.get('company_id') || '').trim()
  const department = String(formData.get('department') || '').trim()
  const startDate = String(formData.get('start_date') || '').trim()
  const dueDate = String(formData.get('due_date') || '').trim()
  const notes = String(formData.get('notes') || '').trim()
  const templateIds = formData.getAll('template_ids') as string[]
  const selectedSectionIds = formData.getAll('template_section_ids') as string[]
  const assignedIds = formData.getAll('assigned_to') as string[]

  const assignmentValidation = await validateAuditMuaviniAssignments(
    supabase,
    user.id,
    assignedIds,
    locale
  )

  if (assignmentValidation.error) {
    return { error: assignmentValidation.error, success: false }
  }

  const validStartDate =
    !startDate || /^\d{4}-\d{2}-\d{2}$/.test(startDate)

  const validDueDate =
    !dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)

  if (!title) {
    return { error: tr(locale, 'titleRequired'), success: false }
  }

  if (!companyId) {
    return { error: tr(locale, 'companyRequired'), success: false }
  }

  if (!validStartDate) {
    return { error: tr(locale, 'invalidStartDate'), success: false }
  }

  if (!validDueDate) {
    return { error: tr(locale, 'invalidDueDate'), success: false }
  }

  if (startDate && dueDate && startDate > dueDate) {
    return { error: tr(locale, 'startAfterDue'), success: false }
  }

  if (templateIds.length === 0) {
    return { error: tr(locale, 'templateRequired'), success: false }
  }

  if (selectedSectionIds.length === 0) {
    return { error: tr(locale, 'sectionRequired'), success: false }
  }

  const { data: existingAnswers, error: answersError } = await supabase
    .from('audit_answers')
    .select('id')
    .eq('plan_id', planId)
    .limit(1)

  if (answersError) {
    return {
      error: tr(locale, 'planAnswersCheckError', { message: answersError.message }),
      success: false,
    }
  }

  const hasAnswers = Boolean(existingAnswers && existingAnswers.length > 0)

  let nextFileUrl: string | null = plan.file_url || null
  let uploadedFilePath: string | null = null
  const file = formData.get('file') as File | null

  try {
    if (file && file.size > 0) {
      const safeName = sanitizeFilename(file.name)
      const fileName = `${Date.now()}_${safeName}`
      const filePath = `plans/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audit-docs')
        .upload(filePath, file)

      if (uploadError) {
        return {
          error: tr(locale, 'fileUploadError', { message: uploadError.message }),
          success: false,
        }
      }

      uploadedFilePath = filePath
      nextFileUrl = filePath
    }

    const uniqueTemplateIds = Array.from(new Set(templateIds.filter(Boolean)))
    const templateId = uniqueTemplateIds[0] || ''

    const updatePayload: any = {
      title,
      company_id: companyId,
      department: department || null,
      start_date: startDate || null,
      due_date: dueDate || null,
      notes,
      file_url: nextFileUrl,
    }

    if (!hasAnswers) {
      updatePayload.template_id = templateId
    }

    const { error: updateError } = await supabase
      .from('audit_plans')
      .update(updatePayload)
      .eq('id', planId)

    if (updateError) throw updateError

    const assignments = Array.from(new Set(assignedIds.filter(Boolean))).map(
      (id) => ({
        plan_id: planId,
        user_id: id,
      })
    )

    const { error: deleteAssignmentsError } = await supabase
      .from('plan_assignments')
      .delete()
      .eq('plan_id', planId)

    if (deleteAssignmentsError) throw deleteAssignmentsError

    if (assignments.length > 0) {
      const { error: insertAssignmentsError } = await supabase
        .from('plan_assignments')
        .insert(assignments)

      if (insertAssignmentsError) throw insertAssignmentsError
    }

    if (!hasAnswers) {
      const planTemplates = uniqueTemplateIds.map((id) => ({
        plan_id: planId,
        template_id: id,
      }))

      const uniqueSectionPairs = Array.from(
        new Set(selectedSectionIds.filter(Boolean))
      )

      const planTemplateSections = uniqueSectionPairs
        .map((value) => {
          const [template_id, section_id] = String(value).split(':')

          if (!template_id || !section_id) return null
          if (!uniqueTemplateIds.includes(template_id)) return null

          return {
            plan_id: planId,
            template_id,
            section_id,
          }
        })
        .filter(Boolean)

      if (planTemplateSections.length === 0) {
        throw new Error(tr(locale, 'selectedSectionsNotFound'))
      }

      const { error: deletePlanTemplatesError } = await supabase
        .from('audit_plan_templates')
        .delete()
        .eq('plan_id', planId)

      if (deletePlanTemplatesError) throw deletePlanTemplatesError

      const { error: deletePlanSectionsError } = await supabase
        .from('audit_plan_template_sections')
        .delete()
        .eq('plan_id', planId)

      if (deletePlanSectionsError) throw deletePlanSectionsError

      const { error: insertPlanTemplatesError } = await supabase
        .from('audit_plan_templates')
        .insert(planTemplates)

      if (insertPlanTemplatesError) throw insertPlanTemplatesError

      const { error: insertPlanSectionsError } = await supabase
        .from('audit_plan_template_sections')
        .insert(planTemplateSections)

      if (insertPlanSectionsError) throw insertPlanSectionsError
    }

    if (uploadedFilePath && plan.file_url) {
      supabase.storage
        .from('audit-docs')
        .remove([plan.file_url])
        .then(({ error }) => {
          if (error) {
            console.error('Köhnə plan faylı storage-dən silinmədi:', error.message)
          }
        })
    }

    revalidatePath('/dashboard/plans')
    revalidatePath(`/dashboard/plans/${planId}`)
    revalidatePath(`/dashboard/plans/${planId}/fill`)
    revalidatePath(`/dashboard/plans/${planId}/report`)
    revalidatePath('/dashboard')

    return { error: null, success: true }
  } catch (err: any) {
    if (uploadedFilePath) {
      await supabase.storage.from('audit-docs').remove([uploadedFilePath])
    }

    return {
      error: err.message || tr(locale, 'planEditError'),
      success: false,
    }
  }
}