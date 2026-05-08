'use server'

import {createClient} from '@/lib/supabase/server'
import {revalidatePath} from 'next/cache'

type Locale = 'az' | 'en' | 'ru'

const I18N = {
  az: {
    nameRequired: 'Şirkət adı boş ola bilməz.',
    idMissing: 'Şirkət ID tapılmadı.',
    genericError: 'Xəta: {message}',
    updateError: 'Şirkət yenilənmədi: {message}',
    usageCheckError: 'Şirkət istifadəsi yoxlanılarkən xəta: {message}',
    inUse:
      'Bu şirkət silinə bilməz, çünki {count} audit planında istifadə olunur. Əvvəl həmin audit planlarını silin və ya başqa şirkətə keçirin.',
    deleteError: 'Şirkət silinə bilmədi: {message}',
  },
  en: {
    nameRequired: 'Company name cannot be empty.',
    idMissing: 'Company ID was not found.',
    genericError: 'Error: {message}',
    updateError: 'Company was not updated: {message}',
    usageCheckError: 'Error checking company usage: {message}',
    inUse:
      'This company cannot be deleted because it is used in {count} audit plan(s). Delete those audit plans first or move them to another company.',
    deleteError: 'Company could not be deleted: {message}',
  },
  ru: {
    nameRequired: 'Название компании не может быть пустым.',
    idMissing: 'ID компании не найден.',
    genericError: 'Ошибка: {message}',
    updateError: 'Компания не была обновлена: {message}',
    usageCheckError: 'Ошибка проверки использования компании: {message}',
    inUse:
      'Эту компанию нельзя удалить, потому что она используется в {count} плане(ах) аудита. Сначала удалите эти планы аудита или перенесите их в другую компанию.',
    deleteError: 'Не удалось удалить компанию: {message}',
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

export async function createCompany(prevState: any, formData: FormData) {
  const locale = getLocale(formData.get('locale'))
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()

  if (!name) {
    return {error: tr(locale, 'nameRequired')}
  }

  const {error} = await supabase.from('companies').insert([{name}])

  if (error) {
    return {error: tr(locale, 'genericError', {message: error.message})}
  }

  revalidatePath('/dashboard/companies')
  return {success: true}
}

export async function updateCompany(companyId: string, formData: FormData) {
  const locale = getLocale(formData.get('locale'))
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()

  if (!companyId) {
    return {error: tr(locale, 'idMissing')}
  }

  if (!name) {
    return {error: tr(locale, 'nameRequired')}
  }

  const {error} = await supabase
    .from('companies')
    .update({name})
    .eq('id', companyId)

  if (error) {
    return {error: tr(locale, 'updateError', {message: error.message})}
  }

  revalidatePath('/dashboard/companies')
  return {success: true}
}

export async function deleteCompany(companyId: string, localeInput?: string) {
  const locale = getLocale(localeInput)
  const supabase = await createClient()

  if (!companyId) {
    return {error: tr(locale, 'idMissing')}
  }

  const {count: planCount, error: planCheckError} = await supabase
    .from('audit_plans')
    .select('id', {count: 'exact', head: true})
    .eq('company_id', companyId)

  if (planCheckError) {
    return {
      error: tr(locale, 'usageCheckError', {message: planCheckError.message}),
    }
  }

  if ((planCount || 0) > 0) {
    return {
      error: tr(locale, 'inUse', {count: planCount}),
    }
  }

  const {error} = await supabase.from('companies').delete().eq('id', companyId)

  if (error) {
    return {
      error: tr(locale, 'deleteError', {message: error.message}),
    }
  }

  revalidatePath('/dashboard/companies')
  return {success: true}
}