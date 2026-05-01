'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  error: string | null
  success: boolean
}

export async function createDepartment(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()
  const companyId = String(formData.get('company_id') || '').trim()

  if (!name) {
    return { error: 'Departament adı daxil edilməlidir.', success: false }
  }

  if (!companyId) {
    return { error: 'Şirkət seçilməlidir.', success: false }
  }

  const { error } = await supabase.from('departments').insert([
    {
      name,
      company_id: companyId,
    },
  ])

  if (error) {
    return {
      error: 'Departament əlavə olunmadı: ' + error.message,
      success: false,
    }
  }

  revalidatePath('/dashboard/admin/departments')
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
}

export async function updateDepartment(
  departmentId: string,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const name = String(formData.get('name') || '').trim()
  const companyId = String(formData.get('company_id') || '').trim()

  if (!departmentId) {
    return { error: 'Departament ID tapılmadı.', success: false }
  }

  if (!name) {
    return { error: 'Departament adı daxil edilməlidir.', success: false }
  }

  if (!companyId) {
    return { error: 'Şirkət seçilməlidir.', success: false }
  }

  const { error } = await supabase
    .from('departments')
    .update({
      name,
      company_id: companyId,
    })
    .eq('id', departmentId)

  if (error) {
    return {
      error: 'Departament yenilənmədi: ' + error.message,
      success: false,
    }
  }

  revalidatePath('/dashboard/admin/departments')
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
}

export async function deleteDepartment(
  departmentId: string
): Promise<ActionState> {
  const supabase = await createClient()

  if (!departmentId) {
    return { error: 'Departament ID tapılmadı.', success: false }
  }

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', departmentId)

  if (error) {
    return {
      error:
        'Departament silinmədi. Bu departament başqa məlumatlarda istifadə oluna bilər: ' +
        error.message,
      success: false,
    }
  }

  revalidatePath('/dashboard/admin/departments')
  revalidatePath('/dashboard/plans')

  return { error: null, success: true }
}