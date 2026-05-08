'use server'

import {createClient} from '@/lib/supabase/server'
import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'

const LOCALES = ['az', 'ru', 'en'] as const
const DEFAULT_LOCALE = 'az'

function getSafeLocale(value?: string | null) {
  if (value && LOCALES.includes(value as any)) {
    return value
  }

  return DEFAULT_LOCALE
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  const locale = getSafeLocale(cookieStore.get('NEXT_LOCALE')?.value)

  redirect(`/${locale}/login`)
}