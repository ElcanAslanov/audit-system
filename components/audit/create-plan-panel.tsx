'use client'

import { useState } from 'react'
import CreatePlanForm from '@/components/create-plan-form'

export default function CreatePlanPanel({
  companies,
  auditors,
  templates,
}: {
  companies: any[]
  auditors: any[]
  templates: any[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Yeni Audit Planı
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Şirkət, şablon və auditor seçərək yeni audit planı yaradın.
          </p>
        </div>

        <span className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto">
          {open ? 'Formu bağla' : '+ Yeni plan yarat'}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 p-4 sm:p-6">
          <CreatePlanForm
            companies={companies}
            auditors={auditors}
            templates={templates}
            onSuccess={() => setOpen(false)}
          />
        </div>
      )}
    </section>
  )
}