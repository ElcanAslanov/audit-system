'use server'

import {createClient} from '@/lib/supabase/server'
import {revalidatePath} from 'next/cache'

export type ActionState = {
  error: string | null
  success: boolean
}

type Locale = 'az' | 'en' | 'ru'

const I18N = {
  az: {
    nameRequired: 'Departament adı daxil edilməlidir.',
    companyRequired: 'Şirkət seçilməlidir.',
    idMissing: 'Departament ID tapılmadı.',
    createError: 'Departament əlavə olunmadı: {message}',
    updateError: 'Departament yenilənmədi: {message}',
    deleteError:
      'Departament silinmədi. Bu departament başqa məlumatlarda istifadə oluna bilər: {message}',
  },
  en: {
    nameRequired: 'Department name is required.',
    companyRequired: 'Company must be selected.',
    idMissing: 'Department ID was not found.',
    createError: 'Department was not added: {message}',
    updateError: 'Department was not updated: {message}',
    deleteError:
      'Department was not deleted. This department may be used in other data: {message}',
  },
  ru: {
    nameRequired: 'Название отдела обязательно.',
    companyRequired: 'Необходимо выбрать компанию.',
    idMissing: 'ID отдела не найден.',
    createError: 'Отдел не был добавлен: {message}',
    updateError: 'Отдел не был обновлен: {message}',
    deleteError:
      'Отдел не был удален. Этот отдел может использоваться в других данных: {message}',
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

export async function createDepartment(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const locale = getLocale(formData.get('locale'))
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()
  const companyId = String(formData.get('company_id') || '').trim()

  if (!name) {
    return {error: tr(locale, 'nameRequired'), success: false}
  }

  if (!companyId) {
    return {error: tr(locale, 'companyRequired'), success: false}
  }

  const {error} = await supabase.from('departments').insert([
    {
      name,
      company_id: companyId,
    },
  ])

  if (error) {
    return {
      error: tr(locale, 'createError', {message: error.message}),
      success: false,
    }
  }

  revalidatePath('/dashboard/departments')
  revalidatePath('/dashboard/admin/departments')
  revalidatePath('/dashboard/plans')

  return {error: null, success: true}
}

export async function updateDepartment(
  departmentId: string,
  formData: FormData
): Promise<ActionState> {
  const locale = getLocale(formData.get('locale'))
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()
  const companyId = String(formData.get('company_id') || '').trim()

  if (!departmentId) {
    return {error: tr(locale, 'idMissing'), success: false}
  }

  if (!name) {
    return {error: tr(locale, 'nameRequired'), success: false}
  }

  if (!companyId) {
    return {error: tr(locale, 'companyRequired'), success: false}
  }

  const {error} = await supabase
    .from('departments')
    .update({
      name,
      company_id: companyId,
    })
    .eq('id', departmentId)

  if (error) {
    return {
      error: tr(locale, 'updateError', {message: error.message}),
      success: false,
    }
  }

  revalidatePath('/dashboard/departments')
  revalidatePath('/dashboard/admin/departments')
  revalidatePath('/dashboard/plans')

  return {error: null, success: true}
}

export async function deleteDepartment(
  departmentId: string,
  localeInput?: string
): Promise<ActionState> {
  const locale = getLocale(localeInput)
  const supabase = await createClient()

  if (!departmentId) {
    return {error: tr(locale, 'idMissing'), success: false}
  }

  const {error} = await supabase
    .from('departments')
    .delete()
    .eq('id', departmentId)

  if (error) {
    return {
      error: tr(locale, 'deleteError', {message: error.message}),
      success: false,
    }
  }

  revalidatePath('/dashboard/departments')
  revalidatePath('/dashboard/admin/departments')
  revalidatePath('/dashboard/plans')

  return {error: null, success: true}
}