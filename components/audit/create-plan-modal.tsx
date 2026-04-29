'use client'

import { useEffect, useState } from 'react'
import CreatePlanForm from '@/components/create-plan-form'
import { PlusCircle, X } from 'lucide-react'

export default function CreatePlanModal({
  companies,
  auditors,
  templates,
}: {
  companies: any[]
  auditors: any[]
  templates: any[]
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const openModal = () => {
    setMounted(true)

    requestAnimationFrame(() => {
      setOpen(true)
    })
  }

  const closeModal = () => {
    setOpen(false)

    window.setTimeout(() => {
      setMounted(false)
    }, 250)
  }

  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mounted])

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
      >
        <PlusCircle size={16} />
        Yeni plan yarat
      </button>

      {mounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <button
            type="button"
            aria-label="Modalı bağla"
            onClick={closeModal}
            className={`absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            className={`relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out ${
              open
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-4 scale-95 opacity-0'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Audit planı
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                  Yeni Audit Planı
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Şirkət, şablonlar, auditorlar və son tarix məlumatlarını
                  daxil edin.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto bg-slate-50 p-4 sm:p-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <CreatePlanForm
                  companies={companies}
                  auditors={auditors}
                  templates={templates}
                  onSuccess={closeModal}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}