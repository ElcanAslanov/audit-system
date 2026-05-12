'use server'

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getUserProfile = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.id) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, company_id, full_name, email')
    .eq('id', user.id)
    .limit(1)
    .maybeSingle()

  if (profileError || !profile) {
    return null
  }

  return {
    id: profile.id,
    userId: user.id,
    role: profile.role || '',
    company_id: profile.company_id,
    full_name: profile.full_name || '',
    email: profile.email || user.email || '',
    fullName: profile.full_name || '',
    name: profile.full_name || '',
  }
})