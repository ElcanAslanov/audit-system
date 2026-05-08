'use server'

import {supabaseAdmin} from '@/lib/supabase/admin'
import {revalidatePath} from 'next/cache'

type Locale = 'az' | 'en' | 'ru'

const I18N = {
  az: {
    fullNameRequired: 'Ad soyad boş ola bilməz.',
    emailRequired: 'Email boş ola bilməz.',
    passwordRequired: 'Şifrə minimum 6 simvol olmalıdır.',
    newPasswordRequired: 'Yeni şifrə minimum 6 simvol olmalıdır.',
    roleRequired: 'Rol seçilməlidir.',
    invalidRole: 'Yanlış rol seçilib.',
    authUserIdMissing: 'Auth istifadəçi ID-si tapılmadı.',
    profileCreateError: 'Profil yaradılarkən xəta: {message}',
    userIdMissing: 'İstifadəçi ID tapılmadı.',
    profileDeleteError: 'Profil silinmədi: {message}',
  },
  en: {
    fullNameRequired: 'Full name cannot be empty.',
    emailRequired: 'Email cannot be empty.',
    passwordRequired: 'Password must be at least 6 characters.',
    newPasswordRequired: 'New password must be at least 6 characters.',
    roleRequired: 'Role must be selected.',
    invalidRole: 'Invalid role selected.',
    authUserIdMissing: 'Auth user ID was not found.',
    profileCreateError: 'Error creating profile: {message}',
    userIdMissing: 'User ID was not found.',
    profileDeleteError: 'Profile was not deleted: {message}',
  },
  ru: {
    fullNameRequired: 'Имя и фамилия не могут быть пустыми.',
    emailRequired: 'Email не может быть пустым.',
    passwordRequired: 'Пароль должен быть минимум 6 символов.',
    newPasswordRequired: 'Новый пароль должен быть минимум 6 символов.',
    roleRequired: 'Необходимо выбрать роль.',
    invalidRole: 'Выбрана неверная роль.',
    authUserIdMissing: 'ID пользователя Auth не найден.',
    profileCreateError: 'Ошибка создания профиля: {message}',
    userIdMissing: 'ID пользователя не найден.',
    profileDeleteError: 'Профиль не был удален: {message}',
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

function cleanString(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

const ALLOWED_ROLES = new Set([
  'admin',
  'rehber',
  'musahideci',
  'audit_muavini',
  'auditor',
])

function normalizeRole(value: FormDataEntryValue | string | null) {
  return String(value || '').trim().toLowerCase()
}

function validateRole(role: string) {
  return ALLOWED_ROLES.has(role)
}

export async function createUser(prevState: any, formData: FormData) {
  const locale = getLocale(formData.get('locale'))

  const email = cleanString(formData.get('email')).toLowerCase()
  const password = cleanString(formData.get('password'))
  const full_name = cleanString(formData.get('full_name'))
  const role = normalizeRole(formData.get('role'))
  const company_id = cleanString(formData.get('company_id'))

  if (!full_name) {
    return {error: tr(locale, 'fullNameRequired')}
  }

  if (!email) {
    return {error: tr(locale, 'emailRequired')}
  }

  if (!password || password.length < 6) {
    return {error: tr(locale, 'passwordRequired')}
  }

  if (!role) {
    return {error: tr(locale, 'roleRequired')}
  }

  if (!validateRole(role)) {
    return {error: tr(locale, 'invalidRole')}
  }

  const {data, error: authError} = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {full_name},
  })

  if (authError) {
    return {error: authError.message}
  }

  if (!data.user?.id) {
    return {error: tr(locale, 'authUserIdMissing')}
  }

  const {error: dbError} = await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    full_name,
    email,
    role,
    company_id: company_id || null,
  })

  if (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)

    return {
      error: tr(locale, 'profileCreateError', {message: dbError.message}),
    }
  }

  revalidatePath('/dashboard/admin')
  return {success: true}
}

export async function updateUserProfile(
  userId: string,
  data: {
    full_name: string
    email: string
    role: string
    company_id: string
    password?: string
    locale?: string
  }
) {
  const locale = getLocale(data.locale)

  const full_name = String(data.full_name || '').trim()
  const email = String(data.email || '').trim().toLowerCase()
  const role = normalizeRole(data.role)
  const company_id = String(data.company_id || '').trim()
  const password = String(data.password || '').trim()

  if (!userId) {
    return {error: tr(locale, 'userIdMissing')}
  }

  if (!full_name) {
    return {error: tr(locale, 'fullNameRequired')}
  }

  if (!email) {
    return {error: tr(locale, 'emailRequired')}
  }

  if (!role) {
    return {error: tr(locale, 'roleRequired')}
  }

  if (!validateRole(role)) {
    return {error: tr(locale, 'invalidRole')}
  }

  const authUpdatePayload: {
    email: string
    user_metadata: {full_name: string}
    password?: string
  } = {
    email,
    user_metadata: {full_name},
  }

  if (password) {
    if (password.length < 6) {
      return {error: tr(locale, 'newPasswordRequired')}
    }

    authUpdatePayload.password = password
  }

  const {error: authError} = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    authUpdatePayload
  )

  if (authError) {
    return {error: authError.message}
  }

  const {error: dbError} = await supabaseAdmin
    .from('profiles')
    .update({
      full_name,
      email,
      role,
      company_id: company_id || null,
    })
    .eq('id', userId)

  if (dbError) {
    return {error: dbError.message}
  }

  revalidatePath('/dashboard/admin')
  return {success: true}
}

export async function deleteUser(userId: string, localeInput?: string) {
  const locale = getLocale(localeInput)

  if (!userId) {
    return {error: tr(locale, 'userIdMissing')}
  }

  const {error: profileError} = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    return {
      error: tr(locale, 'profileDeleteError', {message: profileError.message}),
    }
  }

  const {error: authError} = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    return {error: authError.message}
  }

  revalidatePath('/dashboard/admin')
  return {success: true}
}

export async function updateUserRole(
  userId: string,
  newRole: string,
  localeInput?: string
) {
  const locale = getLocale(localeInput)
  const role = normalizeRole(newRole)

  if (!userId) {
    return {error: tr(locale, 'userIdMissing')}
  }

  if (!role) {
    return {error: tr(locale, 'roleRequired')}
  }

  if (!validateRole(role)) {
    return {error: tr(locale, 'invalidRole')}
  }

  const {error} = await supabaseAdmin
    .from('profiles')
    .update({role})
    .eq('id', userId)

  if (error) {
    return {error: error.message}
  }

  revalidatePath('/dashboard/admin')
  return {success: true}
}