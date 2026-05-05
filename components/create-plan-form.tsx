'use client'

import { useEffect, useMemo, useRef, useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createAuditPlan } from '@/app/dashboard/plans/actions'
import { Loader2, Plus, Search, UploadCloud } from 'lucide-react'

export default function CreatePlanForm({
  companies,
  departments,
  auditors,
  templates,
  onSuccess,
}: {
  companies: any[]
  departments: any[]
  auditors: any[]
  templates: any[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)

  const [state, action, pending] = useActionState(createAuditPlan, null)
  const [searchTerm, setSearchTerm] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')

  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('')
  const [dueDateDisplay, setDueDateDisplay] = useState('')
  const [startDateDisplay, setStartDateDisplay] = useState('')

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [selectedSectionIds, setSelectedSectionIds] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (!state?.success) return

    formRef.current?.reset()
    setSearchTerm('')
    setTemplateSearch('')
    setSelectedCompanyId('')
    setSelectedDepartmentName('')
    setDueDateDisplay('')
    setStartDateDisplay('')
    setSelectedTemplateIds([])
    setSelectedSectionIds({})
    router.refresh()
    onSuccess?.()
  }, [state?.success, router, onSuccess])

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
      (department: any) => String(department.company_id) === String(selectedCompanyId)
    )
  }, [departments, selectedCompanyId])

  function toggleTemplate(template: any, checked: boolean) {
    const templateId = String(template.id)

    const sectionIds = (template.template_sections || []).map((section: any) =>
      String(section.id)
    )

    if (checked) {
      setSelectedTemplateIds((prev) =>
        prev.includes(templateId) ? prev : [...prev, templateId]
      )

      // Şablon seçiləndə onun bütün bölmələri avtomatik seçilir.
      // İstəmədiyin bölmənin checkbox-ını çıxara bilərsən.
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

  function formatDateInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)

    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  function displayDateToIso(value: string) {
    const [day, month, year] = value.split('/')

    if (!day || !month || !year || year.length !== 4) return ''

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  function toggleSection(templateId: string, sectionId: string, checked: boolean) {
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

  return (
    <form ref={formRef} action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Audit planı uğurla yaradıldı.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Planın başlığı
              </label>
              <input
                name="title"
                required
                placeholder="Məs: 2026 İllik İT Auditi"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
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
                onChange={(e) => setStartDateDisplay(formatDateInput(e.target.value))}
                maxLength={10}
                placeholder="GG/AA/İİİİ"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-slate-500">
                Məsələn: 01/03/2026
              </p>
            </div>



            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
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
                onChange={(e) => setDueDateDisplay(formatDateInput(e.target.value))}
                placeholder="GG/AA/İİİİ"
                maxLength={10}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-slate-500">
                Məsələn: 31/12/2026
              </p>
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
                Departament <span className="font-semibold text-slate-400">(istəyə bağlı)</span>
              </label>

              <select
                name="department"
                disabled={!selectedCompanyId}
                value={selectedDepartmentName}
                onChange={(e) => setSelectedDepartmentName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {selectedCompanyId ? 'Departament seçin' : 'Əvvəl şirkət seçin...'}
                </option>

                {filteredDepartments.map((department: any) => (
                  <option key={department.id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select>

              {selectedCompanyId && filteredDepartments.length === 0 && (
                <p className="mt-1 text-xs text-red-500">
                  Bu şirkət üçün departament tapılmadı.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Şablon axtar
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={templateSearch}
                  placeholder="Şablon adı ilə axtar..."
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Audit şablonları
              </label>

              <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                {filteredTemplates.length === 0 && (
                  <p className="p-2 text-sm text-slate-500">
                    Şablon tapılmadı.
                  </p>
                )}

                {filteredTemplates.map((t) => {
                  const templateId = String(t.id)
                  const isTemplateSelected = selectedTemplateIds.includes(templateId)

                  const sections = [...(t.template_sections || [])].sort(
                    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
                  )

                  return (
                    <div
                      key={t.id}
                      className="rounded-xl p-2 text-sm transition hover:bg-white"
                    >
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          name="template_ids"
                          value={t.id}
                          checked={isTemplateSelected}
                          onChange={(e) => toggleTemplate(t, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span className="font-semibold text-slate-700">
                          {t.title}
                        </span>
                      </label>

                      {isTemplateSelected && (
                        <div className="ml-7 mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-2">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Bölmələr
                            </p>

                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                              {selectedSectionIds[templateId]?.length || 0}/{sections.length} seçili
                            </span>
                          </div>

                          {sections.length === 0 ? (
                            <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-400">
                              Bu şablonda bölmə yoxdur.
                            </p>
                          ) : (
                            sections.map((section: any) => {
                              const sectionId = String(section.id)
                              const isSectionSelected =
                                selectedSectionIds[templateId]?.includes(sectionId) ?? false

                              return (
                                <label
                                  key={section.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-slate-50"
                                >
                                  <input
                                    type="checkbox"
                                    name="template_section_ids"
                                    value={`${templateId}:${section.id}`}
                                    checked={isSectionSelected}
                                    onChange={(e) =>
                                      toggleSection(templateId, sectionId, e.target.checked)
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />

                                  <span className="font-medium text-slate-600">
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

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Bir və ya bir neçə şablon seçə bilərsiniz.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Qeydlər
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Audit haqqında əlavə məlumat..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Auditorları təyin et
            </label>

            <div className="relative">
              <Search
                className="absolute left-3 top-3.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Auditor axtar..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
            {filteredAuditors.length > 0 ? (
              filteredAuditors.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition hover:bg-white"
                >
                  <input
                    type="checkbox"
                    name="assigned_to"
                    value={a.id}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {a.full_name}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-sm italic text-slate-400">
                  İstifadəçi tapılmadı
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
              <UploadCloud size={18} />
              Fayl əlavə et
            </label>

            <input
              type="file"
              name="file"
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 file:mr-4 file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-slate-800"
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              PDF, Word, Excel və ya digər audit faylı əlavə edə bilərsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-3 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:-mx-5 sm:-mb-5 sm:flex-row sm:items-center sm:justify-end">
        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Plus size={18} />
          )}
          {pending ? 'Yaradılır...' : 'Planı yarat'}
        </button>
      </div>
    </form>
  )
}