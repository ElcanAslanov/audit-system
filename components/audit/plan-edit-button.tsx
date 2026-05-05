'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateAuditPlan } from '@/app/dashboard/plans/actions'
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  FileUp,
  Loader2,
  Pencil,
  Save,
  Search,
  Users,
  X,
} from 'lucide-react'

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function isoToDisplayDate(value?: string | null) {
  if (!value) return ''

  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) return ''

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function displayDateToIso(value: string) {
  const [day, month, year] = value.split('/')

  if (!day || !month || !year || year.length !== 4) return ''

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export default function PlanEditButton({
  plan,
  companies,
  departments,
  auditors,
  templates,
  compact = true,
}: {
  plan: any
  companies: any[]
  departments: any[]
  auditors: any[]
  templates: any[]
  compact?: boolean
}) {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')

  const [title, setTitle] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('')
  const [startDateDisplay, setStartDateDisplay] = useState('')
  const [dueDateDisplay, setDueDateDisplay] = useState('')
  const [notes, setNotes] = useState('')

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [selectedSectionIds, setSelectedSectionIds] = useState<Record<string, string[]>>({})
  const [selectedAuditorIds, setSelectedAuditorIds] = useState<string[]>([])

  const hasAnswers = (plan.audit_answers?.length || 0) > 0

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetFromPlan = () => {
    const planTemplateIds =
      plan.audit_plan_templates?.map((item: any) => String(item.template_id)) ||
      []

    const sectionMap: Record<string, string[]> = {}

    ;(plan.audit_plan_template_sections || []).forEach((item: any) => {
      const templateId = String(item.template_id)
      const sectionId = String(item.section_id)

      sectionMap[templateId] = sectionMap[templateId] || []
      sectionMap[templateId].push(sectionId)
    })

    const assignmentIds =
      plan.plan_assignments?.map((item: any) => String(item.user_id)) || []

    setTitle(plan.title || '')
    setSelectedCompanyId(plan.company_id || '')
    setSelectedDepartmentName(plan.department || '')
    setStartDateDisplay(isoToDisplayDate(plan.start_date))
    setDueDateDisplay(isoToDisplayDate(plan.due_date))
    setNotes(plan.notes || '')
    setSelectedTemplateIds(planTemplateIds)
    setSelectedSectionIds(sectionMap)
    setSelectedAuditorIds(assignmentIds)
    setSearchTerm('')
    setTemplateSearch('')
    setError(null)
    setSuccess(null)
  }

  useEffect(() => {
    if (!open) return
    resetFromPlan()
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, isPending])

  const filteredAuditors = useMemo(() => {
    return auditors.filter((a) =>
      (a.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [auditors, searchTerm])

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) =>
      (t.title || '').toLowerCase().includes(templateSearch.toLowerCase())
    )
  }, [templates, templateSearch])

  const filteredDepartments = useMemo(() => {
    if (!selectedCompanyId) return []

    return departments.filter(
      (department: any) =>
        String(department.company_id) === String(selectedCompanyId)
    )
  }, [departments, selectedCompanyId])

  function toggleTemplate(template: any, checked: boolean) {
    if (hasAnswers) return

    const templateId = String(template.id)

    const sectionIds = (template.template_sections || []).map((section: any) =>
      String(section.id)
    )

    if (checked) {
      setSelectedTemplateIds((prev) =>
        prev.includes(templateId) ? prev : [...prev, templateId]
      )

      setSelectedSectionIds((prev) => ({
        ...prev,
        [templateId]: sectionIds,
      }))

      return
    }

    setSelectedTemplateIds((prev) => prev.filter((id) => id !== templateId))

    setSelectedSectionIds((prev) => {
      const next = { ...prev }
      delete next[templateId]
      return next
    })
  }

  function toggleSection(templateId: string, sectionId: string, checked: boolean) {
    if (hasAnswers) return

    setSelectedSectionIds((prev) => {
      const current = prev[templateId] || []

      return {
        ...prev,
        [templateId]: checked
          ? Array.from(new Set([...current, sectionId]))
          : current.filter((id) => id !== sectionId),
      }
    })
  }

  function toggleAuditor(userId: string, checked: boolean) {
    setSelectedAuditorIds((prev) =>
      checked
        ? Array.from(new Set([...prev, userId]))
        : prev.filter((id) => id !== userId)
    )
  }

  const closeModal = () => {
    if (isPending) return
    setOpen(false)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)

    selectedTemplateIds.forEach((id) => {
      formData.append('template_ids', id)
    })

    Object.entries(selectedSectionIds).forEach(([templateId, sectionIds]) => {
      sectionIds.forEach((sectionId) => {
        formData.append('template_section_ids', `${templateId}:${sectionId}`)
      })
    })

    selectedAuditorIds.forEach((id) => {
      formData.append('assigned_to', id)
    })

    startTransition(async () => {
      const result = await updateAuditPlan(plan.id, formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Audit planı uğurla redaktə edildi.')
      router.refresh()

      window.setTimeout(() => {
        setOpen(false)
      }, 600)
    })
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-2 backdrop-blur-md sm:p-4"
            onClick={closeModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
              className="my-2 flex max-h-[calc(100dvh-16px)] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-32px)] sm:rounded-[2rem]"
            >
              <div className="relative overflow-hidden border-b border-slate-100 bg-slate-950 p-5 text-white sm:p-6">
                <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-blue-500/30 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-white/10">
                      <Pencil size={22} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                        Audit planı redaktəsi
                      </p>

                      <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                        {title || 'Planı redaktə et'}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                        Planın əsas məlumatlarını, auditorları, faylı və şablon tərkibini yeniləyin.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 sm:p-6 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent]">
                  <div className="space-y-5">
                    {error && (
                      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 shadow-sm">
                        {success}
                      </div>
                    )}

                    {hasAnswers && (
                      <div className="flex gap-3 rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold leading-6 text-yellow-800 shadow-sm">
                        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-black">Plan artıq doldurulub</p>
                          <p className="mt-1">
                            Şablon və bölmə tərkibi qorunur. Əsas məlumatlar,
                            fayl və auditorlar redaktə oluna bilər.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-5">
                      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
                        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                            <Building2 size={18} />
                          </div>

                          <div>
                            <h3 className="font-black text-slate-950">
                              Əsas məlumatlar
                            </h3>
                            <p className="text-xs font-semibold text-slate-500">
                              Plan adı, şirkət, departament və tarixlər
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-slate-700">
                              Planın başlığı
                            </label>
                            <input
                              name="title"
                              required
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Məs: 2026 İllik İT Auditi"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1 flex items-center gap-1 text-sm font-bold text-slate-700">
                              <CalendarDays size={15} />
                              Başlama tarixi
                            </label>

                            <input
                              type="hidden"
                              name="start_date"
                              value={displayDateToIso(startDateDisplay)}
                            />

                            <input
                              type="text"
                              inputMode="numeric"
                              value={startDateDisplay}
                              onChange={(e) =>
                                setStartDateDisplay(formatDateInput(e.target.value))
                              }
                              maxLength={10}
                              placeholder="GG/AA/İİİİ"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1 flex items-center gap-1 text-sm font-bold text-slate-700">
                              <CalendarDays size={15} />
                              Son tarix
                            </label>

                            <input
                              type="hidden"
                              name="due_date"
                              value={displayDateToIso(dueDateDisplay)}
                            />

                            <input
                              type="text"
                              inputMode="numeric"
                              value={dueDateDisplay}
                              onChange={(e) =>
                                setDueDateDisplay(formatDateInput(e.target.value))
                              }
                              placeholder="GG/AA/İİİİ"
                              maxLength={10}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">
                              Şirkət
                            </label>
                            <select
                              name="company_id"
                              required
                              value={selectedCompanyId}
                              onChange={(e) => {
                                setSelectedCompanyId(e.target.value)
                                setSelectedDepartmentName('')
                              }}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="">Şirkət seçin...</option>
                              {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">
                              Departament{' '}
                              <span className="font-semibold text-slate-400">
                                (istəyə bağlı)
                              </span>
                            </label>

                            <select
                              name="department"
                              disabled={!selectedCompanyId}
                              value={selectedDepartmentName}
                              onChange={(e) => setSelectedDepartmentName(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="">
                                {selectedCompanyId
                                  ? 'Departament seçin'
                                  : 'Əvvəl şirkət seçin...'}
                              </option>

                              {filteredDepartments.map((department: any) => (
                                <option key={department.id} value={department.name}>
                                  {department.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-bold text-slate-700">
                              Qeydlər
                            </label>
                            <textarea
                              name="notes"
                              rows={4}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Audit haqqında əlavə məlumat..."
                              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      </section>

                      <section className="space-y-5">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <Users size={18} />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-950">
                                Auditorlar
                              </h3>
                              <p className="text-xs font-semibold text-slate-500">
                                Plana təyin olunacaq şəxslər
                              </p>
                            </div>
                          </div>

                          <div className="relative">
                            <Search
                              className="absolute left-3 top-3.5 text-slate-400"
                              size={16}
                            />
                            <input
                              type="text"
                              placeholder="Auditor axtar..."
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          <div className="mt-3 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent]">
                            {filteredAuditors.length > 0 ? (
                              filteredAuditors.map((a) => {
                                const auditorId = String(a.id)
                                const checked = selectedAuditorIds.includes(auditorId)

                                return (
                                  <label
                                    key={a.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
                                      checked
                                        ? 'border-blue-200 bg-blue-50'
                                        : 'border-transparent hover:bg-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) =>
                                        toggleAuditor(auditorId, e.target.checked)
                                      }
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-black text-slate-800">
                                        {a.full_name}
                                      </p>
                                      <p className="truncate text-xs font-semibold text-slate-500">
                                        {a.role || 'İstifadəçi'}
                                      </p>
                                    </div>
                                  </label>
                                )
                              })
                            ) : (
                              <div className="flex h-40 items-center justify-center text-center">
                                <p className="text-sm italic text-slate-400">
                                  İstifadəçi tapılmadı
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                              <FileUp size={18} />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-950">
                                Plan faylı
                              </h3>
                              <p className="text-xs font-semibold text-slate-500">
                                Yeni fayl seçsən, köhnəsi əvəz olunacaq
                              </p>
                            </div>
                          </div>

                          {plan.file_url && (
                            <p className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">
                              Mövcud fayl saxlanılıb. Yeni fayl seçməsən,
                              olduğu kimi qalacaq.
                            </p>
                          )}

                          <input
                            type="file"
                            name="file"
                            className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800"
                          />
                        </div>
                      </section>
                    </div>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-black text-slate-950">
                            Şablon və bölmələr
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Planın audit tərkibini seçin
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {selectedTemplateIds.length} şablon seçili
                        </span>
                      </div>

                      <div className="relative mb-3">
                        <Search
                          className="absolute left-3 top-3.5 text-slate-400"
                          size={16}
                        />
                        <input
                          type="text"
                          value={templateSearch}
                          placeholder="Şablon adı ilə axtar..."
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          disabled={hasAnswers}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>

                      <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:grid-cols-2 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent]">
                        {filteredTemplates.length === 0 && (
                          <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                            Şablon tapılmadı.
                          </p>
                        )}

                        {filteredTemplates.map((t) => {
                          const templateId = String(t.id)
                          const isTemplateSelected =
                            selectedTemplateIds.includes(templateId)

                          const sections = [...(t.template_sections || [])].sort(
                            (a: any, b: any) =>
                              (a.sort_order || 0) - (b.sort_order || 0)
                          )

                          return (
                            <div
                              key={t.id}
                              className={`rounded-3xl border p-3 transition ${
                                isTemplateSelected
                                  ? 'border-blue-200 bg-white shadow-sm'
                                  : 'border-transparent bg-white/70 hover:bg-white'
                              }`}
                            >
                              <label className="flex cursor-pointer items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isTemplateSelected}
                                  disabled={hasAnswers}
                                  onChange={(e) => toggleTemplate(t, e.target.checked)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-sm font-black text-slate-800">
                                    {t.title}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {sections.length} bölmə
                                  </p>
                                </div>
                              </label>

                              {isTemplateSelected && (
                                <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                      Bölmələr
                                    </p>

                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                      {selectedSectionIds[templateId]?.length || 0}
                                      /{sections.length}
                                    </span>
                                  </div>

                                  {sections.length === 0 ? (
                                    <p className="rounded-xl bg-white p-2 text-xs text-slate-400">
                                      Bu şablonda bölmə yoxdur.
                                    </p>
                                  ) : (
                                    sections.map((section: any) => {
                                      const sectionId = String(section.id)
                                      const isSectionSelected =
                                        selectedSectionIds[templateId]?.includes(
                                          sectionId
                                        ) ?? false

                                      return (
                                        <label
                                          key={section.id}
                                          className={`flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-xs transition ${
                                            isSectionSelected
                                              ? 'bg-blue-50 text-blue-700'
                                              : 'hover:bg-white'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSectionSelected}
                                            disabled={hasAnswers}
                                            onChange={(e) =>
                                              toggleSection(
                                                templateId,
                                                sectionId,
                                                e.target.checked
                                              )
                                            }
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                          />

                                          <span className="font-bold">
                                            {section.title || 'Adsız bölmə'}
                                          </span>
                                        </label>
                                      )
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-3 border-t border-slate-200 bg-white p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-end sm:p-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Ləğv et
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
                  >
                    {isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    {isPending ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        title="Planı redaktə et"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
        className={
          compact
            ? 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100'
            : 'inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100'
        }
      >
        <Pencil size={compact ? 15 : 16} />
        {!compact && 'Planı redaktə et'}
      </button>

      {modal}
    </>
  )
}