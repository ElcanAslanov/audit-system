'use client'

import {useLocale} from 'next-intl'
import {usePathname, useRouter} from '@/i18n/routing'

const languages = [
  {code: 'az', label: 'AZ'},
  {code: 'ru', label: 'RU'},
  {code: 'en', label: 'EN'},
] as const

export default function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const changeLanguage = (nextLocale: 'az' | 'ru' | 'en') => {
    router.replace(pathname, {locale: nextLocale})
  }

  if (compact) {
    return (
      <div className="flex w-10 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-1">
        {languages.map((language) => {
          const active = locale === language.code

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => changeLanguage(language.code)}
              className={`grid h-8 w-full place-items-center rounded-xl text-[11px] font-black transition ${
                active
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {language.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-3 overflow-hidden rounded-full border border-white/10 bg-slate-950/60 p-1">
      {languages.map((language) => {
        const active = locale === language.code

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => changeLanguage(language.code)}
            className={`h-8 min-w-0 rounded-full text-center text-xs font-black transition ${
              active
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {language.label}
          </button>
        )
      })}
    </div>
  )
}