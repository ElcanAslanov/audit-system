'use client'

import {useTranslations} from 'next-intl'

export default function PrintReportButton() {
  const t = useTranslations('printReport')

  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
    >
      {t('button')}
    </button>
  )
}