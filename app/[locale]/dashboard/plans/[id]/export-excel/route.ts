import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

type RouteProps = {
  params: Promise<{ id: string }>
}

type Locale = 'az' | 'en' | 'ru'

const EXCEL_I18N = {
  az: {
    userNotFound: 'İstifadəçi tapılmadı.',
    auditNotFound: 'Audit tapılmadı.',
    viewLocked: 'Bu audit planına baxış kilidlənib.',
    yes: 'Bəli',
    no: 'Xeyr',
    na: 'N/A',
    completed: 'Tamamlandı',
    needsAttention: 'Diqqət tələb edir',
    planned: 'Planlanan',
    open: 'Açıq',
    inProgress: 'İcrada',
    resolved: 'Həll olundu',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    templateFallback: 'Şablon',
    defaultFileBase: 'audit-hesabat',
    fileSuffix: 'hesabat',
    overviewSheet: 'Overview',
    summarySheet: 'Summary',
    checklistSheet: 'Checklist',
    findingsSheet: 'Findings',
    auditReport: 'Audit Hesabatı',
    overviewSubtitle: 'Plan məlumatları, KPI-lar və ümumi nəticələr',
    planInfo: 'Plan məlumatları',
    plan: 'Plan',
    company: 'Şirkət',
    department: 'Departament',
    templates: 'Şablonlar',
    selectedSections: 'Seçilmiş bölmələr',
    status: 'Status',
    score: 'Score',
    startDate: 'Başlama tarixi',
    deadline: 'Son tarix',
    creator: 'Yaradan',
    notes: 'Qeydlər',
    kpiSummary: 'KPI xülasəsi',
    totalAnswers: 'Ümumi cavab',
    yesCount: 'Bəli',
    noProblem: 'Xeyr / Problem',
    findings: 'Çatışmazlıqlar',
    summaryTitle: 'Audit Summary',
    summarySubtitle: 'Cavab, risk və çatışmazlıq statistikası',
    metric: 'Metrik',
    value: 'Dəyər',
    note: 'Qeyd',
    allSavedAnswers: 'Auditdə yadda saxlanılan bütün cavablar',
    positiveAnswers: 'Uyğun cavablar',
    problemAnswers: 'Problemli cavablar',
    excludedAnswers: 'Qiymətləndirməyə daxil edilməyən cavablar',
    createdFindings: 'Audit üzrə yaradılmış çatışmazlıqlar',
    highRiskFindings: 'Yüksək riskli çatışmazlıqlar',
    mediumRiskFindings: 'Orta riskli çatışmazlıqlar',
    lowRiskFindings: 'Aşağı riskli çatışmazlıqlar',
    finalScore: 'Final score',
    checklistTitle: 'Checklist Cavabları',
    checklistSubtitle: 'Hər sual üzrə şablon, bölmə, cavab, bal və şərh detalları',
    numberColumn: 'No',
    type: 'Tip',
    template: 'Şablon',
    section: 'Bölmə',
    question: 'Sual',
    answer: 'Cavab',
    point: 'Bal',
    maxPoint: 'Max bal',
    percent: 'Faiz',
    comment: 'Şərh',
    addedBy: 'Əlavə edən',
    customQuestionType: 'Auditor tərəfindən əlavə edilib',
    templateQuestionType: 'Şablon sualı',
    customQuestion: 'Xüsusi sual',
    customSection: 'Auditor tərəfindən əlavə edilən suallar',
    findingsSubtitle: 'Risklər, statuslar, cavabdeh şəxslər, son tarix və fayl məlumatları',
    title: 'Başlıq',
    risk: 'Risk',
    responsible: 'Cavabdeh',
    description: 'Təsvir',
    files: 'Fayllar',
  },
  en: {
    userNotFound: 'User was not found.',
    auditNotFound: 'Audit was not found.',
    viewLocked: 'View access to this audit plan is locked.',
    yes: 'Yes',
    no: 'No',
    na: 'N/A',
    completed: 'Completed',
    needsAttention: 'Needs attention',
    planned: 'Planned',
    open: 'Open',
    inProgress: 'In progress',
    resolved: 'Resolved',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    templateFallback: 'Template',
    defaultFileBase: 'audit-report',
    fileSuffix: 'report',
    overviewSheet: 'Overview',
    summarySheet: 'Summary',
    checklistSheet: 'Checklist',
    findingsSheet: 'Findings',
    auditReport: 'Audit Report',
    overviewSubtitle: 'Plan details, KPIs, and overall results',
    planInfo: 'Plan details',
    plan: 'Plan',
    company: 'Company',
    department: 'Department',
    templates: 'Templates',
    selectedSections: 'Selected sections',
    status: 'Status',
    score: 'Score',
    startDate: 'Start date',
    deadline: 'Deadline',
    creator: 'Created by',
    notes: 'Notes',
    kpiSummary: 'KPI summary',
    totalAnswers: 'Total answers',
    yesCount: 'Yes',
    noProblem: 'No / Problem',
    findings: 'Findings',
    summaryTitle: 'Audit Summary',
    summarySubtitle: 'Answer, risk, and finding statistics',
    metric: 'Metric',
    value: 'Value',
    note: 'Note',
    allSavedAnswers: 'All answers saved in the audit',
    positiveAnswers: 'Compliant answers',
    problemAnswers: 'Problem answers',
    excludedAnswers: 'Answers excluded from scoring',
    createdFindings: 'Findings created for this audit',
    highRiskFindings: 'High risk findings',
    mediumRiskFindings: 'Medium risk findings',
    lowRiskFindings: 'Low risk findings',
    finalScore: 'Final score',
    checklistTitle: 'Checklist Answers',
    checklistSubtitle: 'Template, section, answer, score, and comment details for each question',
    numberColumn: 'No',
    type: 'Type',
    template: 'Template',
    section: 'Section',
    question: 'Question',
    answer: 'Answer',
    point: 'Score',
    maxPoint: 'Max score',
    percent: 'Percent',
    comment: 'Comment',
    addedBy: 'Added by',
    customQuestionType: 'Added by auditor',
    templateQuestionType: 'Template question',
    customQuestion: 'Custom question',
    customSection: 'Questions added by auditor',
    findingsSubtitle: 'Risks, statuses, responsible persons, deadlines, and file details',
    title: 'Title',
    risk: 'Risk',
    responsible: 'Responsible',
    description: 'Description',
    files: 'Files',
  },
  ru: {
    userNotFound: 'Пользователь не найден.',
    auditNotFound: 'Аудит не найден.',
    viewLocked: 'Просмотр этого плана аудита заблокирован.',
    yes: 'Да',
    no: 'Нет',
    na: 'N/A',
    completed: 'Завершено',
    needsAttention: 'Требует внимания',
    planned: 'Запланировано',
    open: 'Открыто',
    inProgress: 'В работе',
    resolved: 'Решено',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    templateFallback: 'Шаблон',
    defaultFileBase: 'audit-report',
    fileSuffix: 'otchet',
    overviewSheet: 'Overview',
    summarySheet: 'Summary',
    checklistSheet: 'Checklist',
    findingsSheet: 'Findings',
    auditReport: 'Аудиторский отчет',
    overviewSubtitle: 'Данные плана, KPI и общие результаты',
    planInfo: 'Данные плана',
    plan: 'План',
    company: 'Компания',
    department: 'Отдел',
    templates: 'Шаблоны',
    selectedSections: 'Выбранные разделы',
    status: 'Статус',
    score: 'Оценка',
    startDate: 'Дата начала',
    deadline: 'Срок',
    creator: 'Создал',
    notes: 'Примечания',
    kpiSummary: 'Сводка KPI',
    totalAnswers: 'Всего ответов',
    yesCount: 'Да',
    noProblem: 'Нет / Проблема',
    findings: 'Замечания',
    summaryTitle: 'Audit Summary',
    summarySubtitle: 'Статистика ответов, рисков и замечаний',
    metric: 'Метрика',
    value: 'Значение',
    note: 'Примечание',
    allSavedAnswers: 'Все сохраненные ответы по аудиту',
    positiveAnswers: 'Соответствующие ответы',
    problemAnswers: 'Проблемные ответы',
    excludedAnswers: 'Ответы, не включенные в оценку',
    createdFindings: 'Замечания, созданные по аудиту',
    highRiskFindings: 'Замечания высокого риска',
    mediumRiskFindings: 'Замечания среднего риска',
    lowRiskFindings: 'Замечания низкого риска',
    finalScore: 'Итоговая оценка',
    checklistTitle: 'Ответы чек-листа',
    checklistSubtitle: 'Детали шаблона, раздела, ответа, балла и комментария по каждому вопросу',
    numberColumn: 'No',
    type: 'Тип',
    template: 'Шаблон',
    section: 'Раздел',
    question: 'Вопрос',
    answer: 'Ответ',
    point: 'Балл',
    maxPoint: 'Макс. балл',
    percent: 'Процент',
    comment: 'Комментарий',
    addedBy: 'Добавил',
    customQuestionType: 'Добавлено аудитором',
    templateQuestionType: 'Вопрос шаблона',
    customQuestion: 'Пользовательский вопрос',
    customSection: 'Вопросы, добавленные аудитором',
    findingsSubtitle: 'Риски, статусы, ответственные, сроки и данные файлов',
    title: 'Название',
    risk: 'Риск',
    responsible: 'Ответственный',
    description: 'Описание',
    files: 'Файлы',
  },
} as const

function getLocale(request: NextRequest): Locale {
  const locale = new URL(request.url).searchParams.get('locale')

  if (locale === 'en' || locale === 'ru' || locale === 'az') {
    return locale
  }

  return 'az'
}

function normalizeOne(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function answerLabel(value: string | null | undefined, tr: (typeof EXCEL_I18N)[Locale]) {
  if (value === 'yes') return tr.yes
  if (value === 'no') return tr.no
  if (value === 'na') return tr.na
  return '-'
}

function statusLabel(value: string | null | undefined, tr: (typeof EXCEL_I18N)[Locale]) {
  if (value === 'tamamlandi') return tr.completed
  if (value === 'needs_attention') return tr.needsAttention
  if (value === 'planlanan') return tr.planned
  return value || '-'
}

function findingStatusLabel(value: string | null | undefined, tr: (typeof EXCEL_I18N)[Locale]) {
  if (value === 'aciq') return tr.open
  if (value === 'icrada') return tr.inProgress
  if (value === 'hell_olundu') return tr.resolved
  return value || '-'
}

function severityLabel(value: string | null | undefined, tr: (typeof EXCEL_I18N)[Locale]) {
  if (value === 'high') return tr.highRisk
  if (value === 'medium') return tr.mediumRisk
  if (value === 'low') return tr.lowRisk
  return value || '-'
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const raw = String(value)
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (match) {
    const [, year, month, day] = match
    return `${day}.${month}.${year}`
  }

  return raw
}

function safeFileName(value?: string | null) {
  return String(value || 'audit-hesabat')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80)
}

function argb(hex: string) {
  return hex.replace('#', '').toUpperCase()
}

function normalizeColor(hex: string) {
  return { argb: argb(hex) }
}

const FONT_BODY = 'Segoe UI'
const FONT_TITLE = 'Segoe UI Semibold'

function applyTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, endCol: string) {
  ws.mergeCells(`A1:${endCol}1`)
  ws.mergeCells(`A2:${endCol}2`)

  ws.getCell('A1').value = title
  ws.getCell('A2').value = subtitle

  ws.getCell('A1').font = {
    name: FONT_TITLE,
    size: 22,
    bold: true,
    color: normalizeColor('#0F172A'),
  }

  ws.getCell('A2').font = {
    name: FONT_BODY,
    size: 11,
    color: normalizeColor('#64748B'),
  }

  ws.getRow(1).height = 32
  ws.getRow(2).height = 24
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 26

  row.eachCell((cell) => {
    cell.font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#0F172A'),
    }

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: normalizeColor('#EAF2FF'),
    }

    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    }

    cell.border = {
      top: { style: 'thin', color: normalizeColor('#CBD5E1') },
      left: { style: 'thin', color: normalizeColor('#CBD5E1') },
      bottom: { style: 'thin', color: normalizeColor('#CBD5E1') },
      right: { style: 'thin', color: normalizeColor('#CBD5E1') },
    }
  })
}

function styleBodyCell(cell: ExcelJS.Cell) {
  cell.font = {
    name: FONT_BODY,
    size: 10,
    color: normalizeColor('#334155'),
  }

  cell.alignment = {
    vertical: 'top',
    wrapText: true,
  }

  cell.border = {
    top: { style: 'thin', color: normalizeColor('#E2E8F0') },
    left: { style: 'thin', color: normalizeColor('#E2E8F0') },
    bottom: { style: 'thin', color: normalizeColor('#E2E8F0') },
    right: { style: 'thin', color: normalizeColor('#E2E8F0') },
  }
}

function styleBodyRows(ws: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
    const row = ws.getRow(rowNumber)
    row.height = 30

    for (let col = startCol; col <= endCol; col++) {
      const cell = row.getCell(col)
      styleBodyCell(cell)

      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: normalizeColor('#F8FAFC'),
        }
      }
    }
  }
}

function styleSectionLabel(cell: ExcelJS.Cell) {
  cell.font = {
    name: FONT_BODY,
    size: 11,
    bold: true,
    color: normalizeColor('#0F172A'),
  }

  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: normalizeColor('#EEF6FF'),
  }

  cell.alignment = {
    vertical: 'middle',
  }

  cell.border = {
    top: { style: 'thin', color: normalizeColor('#BFDBFE') },
    left: { style: 'thin', color: normalizeColor('#BFDBFE') },
    bottom: { style: 'thin', color: normalizeColor('#BFDBFE') },
    right: { style: 'thin', color: normalizeColor('#BFDBFE') },
  }
}

function applyStatusFill(cell: ExcelJS.Cell, value?: string | null) {
  const label = String(value || '').toLowerCase()

  if (
    label.includes('tamamlandı') ||
    label.includes('bəli') ||
    label.includes('həll') ||
    label.includes('completed') ||
    label.includes('yes') ||
    label.includes('resolved') ||
    label.includes('заверш') ||
    label.includes('да') ||
    label.includes('решено')
  ) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: normalizeColor('#DCFCE7'),
    }
    cell.font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#166534'),
    }
    return
  }

  if (
    label.includes('xeyr') ||
    label.includes('problem') ||
    label.includes('high') ||
    label.includes('no') ||
    label.includes('нет') ||
    label.includes('проблем')
  ) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: normalizeColor('#FEE2E2'),
    }
    cell.font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#991B1B'),
    }
    return
  }

  if (
    label.includes('medium') ||
    label.includes('diqqət') ||
    label.includes('icrada') ||
    label.includes('attention') ||
    label.includes('progress') ||
    label.includes('требует') ||
    label.includes('работе')
  ) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: normalizeColor('#FEF3C7'),
    }
    cell.font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#92400E'),
    }
    return
  }

  if (
    label.includes('n/a') ||
    label.includes('açıq') ||
    label.includes('open') ||
    label.includes('открыто')
  ) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: normalizeColor('#F1F5F9'),
    }
    cell.font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#475569'),
    }
  }
}

function setupWorksheet(ws: ExcelJS.Worksheet) {
  ws.properties.defaultRowHeight = 22
  ws.views = [{ state: 'frozen', ySplit: 4 }]
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  }
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const locale = getLocale(request)
  const tr = EXCEL_I18N[locale]
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: tr.userNotFound }, { status: 401 })
  }

  const { data: plan, error: planError } = await supabase
    .from('audit_plans')
    .select(`
      *,
      companies(name),
      creator:profiles!audit_plans_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .maybeSingle()

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 })
  }

  if (!plan) {
    return NextResponse.json({ error: tr.auditNotFound }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = profile?.role === 'admin'
  const isCreator = plan.created_by === user.id
  const isViewLocked = Boolean(plan.locked_view)

  if (isViewLocked && !isAdmin && !isCreator) {
    return NextResponse.json(
      { error: tr.viewLocked },
      { status: 403 }
    )
  }

  const { data: planTemplates } = await supabase
    .from('audit_plan_templates')
    .select(`
      template_id,
      audit_templates(id, title)
    `)
    .eq('plan_id', id)

  const selectedTemplateNames =
    planTemplates && planTemplates.length > 0
      ? planTemplates
        .map((item: any) => normalizeOne(item.audit_templates)?.title)
        .filter(Boolean)
        .join(', ')
      : '-'

  const { data: planTemplateSections } = await supabase
    .from('audit_plan_template_sections')
    .select(`
      section_id,
      template_sections(
        id,
        title,
        sort_order,
        audit_templates(id, title)
      )
    `)
    .eq('plan_id', id)

  const selectedSectionNames =
    planTemplateSections && planTemplateSections.length > 0
      ? planTemplateSections
        .map((item: any) => {
          const section = normalizeOne(item.template_sections)
          const template = normalizeOne(section?.audit_templates)

          return section?.title
            ? `${template?.title || tr.templateFallback} / ${section.title}`
            : null
        })
        .filter(Boolean)
        .join(', ')
      : '-'

  const { data: answers, error: answersError } = await supabase
    .from('audit_answers')
    .select(`
      id,
      response,
      comment,
      score,
      question_id,
      custom_question_id,
      template_questions(
        question_text,
        max_score,
        template_sections(
          id,
          title,
          sort_order,
          audit_templates(id, title)
        )
      ),
      audit_custom_questions(
        question_text,
        max_score,
        created_by,
        profiles(full_name)
      )
    `)
    .eq('plan_id', id)

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 })
  }

  const { data: findings, error: findingsError } = await supabase
    .from('findings')
    .select(`
      id,
      title,
      severity,
      description,
      deadline,
      status,
      assigned_to,
      files,
      question_id,
      profiles(full_name)
    `)
    .eq('plan_id', id)

  if (findingsError) {
    return NextResponse.json({ error: findingsError.message }, { status: 500 })
  }

  const normalizedCompany = normalizeOne(plan.companies)
  const creatorProfile = normalizeOne((plan as any).creator)

  const totalAnswers = answers?.length || 0
  const yesCount = answers?.filter((a: any) => a.response === 'yes').length || 0
  const noCount = answers?.filter((a: any) => a.response === 'no').length || 0
  const naCount = answers?.filter((a: any) => a.response === 'na').length || 0
  const findingCount = findings?.length || 0
  const highFindings = findings?.filter((f: any) => f.severity === 'high').length || 0
  const mediumFindings = findings?.filter((f: any) => f.severity === 'medium').length || 0
  const lowFindings = findings?.filter((f: any) => f.severity === 'low').length || 0

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Audit System'
  workbook.created = new Date()
  workbook.modified = new Date()

  const overviewSheet = workbook.addWorksheet(tr.overviewSheet)
  setupWorksheet(overviewSheet)
  applyTitle(
    overviewSheet,
    tr.auditReport,
    tr.overviewSubtitle,
    'F'
  )

  overviewSheet.columns = [
    { key: 'a', width: 24 },
    { key: 'b', width: 44 },
    { key: 'c', width: 4 },
    { key: 'd', width: 24 },
    { key: 'e', width: 22 },
    { key: 'f', width: 22 },
  ]

  overviewSheet.getCell('A4').value = tr.planInfo
  overviewSheet.mergeCells('A4:B4')
  styleSectionLabel(overviewSheet.getCell('A4'))

  const overviewRows = [
    [tr.plan, plan.title || '-'],
    [tr.company, normalizedCompany?.name || '-'],
    [tr.department, plan.department || '-'],
    [tr.templates, selectedTemplateNames],
    [tr.selectedSections, selectedSectionNames],
    [tr.status, statusLabel(plan.status, tr)],
    [tr.score, `${plan.score ?? 0}%`],
    [tr.startDate, formatDate(plan.start_date)],
    [tr.deadline, formatDate(plan.due_date)],
    [tr.creator, creatorProfile?.full_name || '-'],
    [tr.notes, plan.notes || '-'],
  ]

  overviewRows.forEach((row, index) => {
    const rowNumber = 5 + index
    overviewSheet.getCell(`A${rowNumber}`).value = row[0]
    overviewSheet.getCell(`B${rowNumber}`).value = row[1]
    styleBodyCell(overviewSheet.getCell(`A${rowNumber}`))
    styleBodyCell(overviewSheet.getCell(`B${rowNumber}`))
    overviewSheet.getCell(`A${rowNumber}`).font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#475569'),
    }
  })

  overviewSheet.getCell('D4').value = tr.kpiSummary
  overviewSheet.mergeCells('D4:F4')
  styleSectionLabel(overviewSheet.getCell('D4'))

  const kpiRows = [
    [tr.totalAnswers, totalAnswers, '#EAF2FF'],
    [tr.yes, yesCount, '#DCFCE7'],
    [tr.noProblem, noCount, '#FEE2E2'],
    [tr.na, naCount, '#F1F5F9'],
    [tr.findings, findingCount, '#FEF3C7'],
    [tr.highRisk, highFindings, '#FEE2E2'],
    [tr.mediumRisk, mediumFindings, '#FEF3C7'],
    [tr.lowRisk, lowFindings, '#DCFCE7'],
  ]

  kpiRows.forEach((item, index) => {
    const rowNumber = 5 + index
    overviewSheet.mergeCells(`D${rowNumber}:E${rowNumber}`)
    overviewSheet.getCell(`D${rowNumber}`).value = item[0]
    overviewSheet.getCell(`F${rowNumber}`).value = item[1] as any

    for (const address of [`D${rowNumber}`, `E${rowNumber}`, `F${rowNumber}`]) {
      const cell = overviewSheet.getCell(address)
      styleBodyCell(cell)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: normalizeColor(item[2] as string),
      }
    }

    overviewSheet.getCell(`D${rowNumber}`).font = {
      name: FONT_BODY,
      size: 10,
      bold: true,
      color: normalizeColor('#334155'),
    }

    overviewSheet.getCell(`F${rowNumber}`).font = {
      name: FONT_BODY,
      size: 15,
      bold: true,
      color: normalizeColor('#0F172A'),
    }

    overviewSheet.getCell(`F${rowNumber}`).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    }
  })

  const summarySheet = workbook.addWorksheet(tr.summarySheet)
  setupWorksheet(summarySheet)
  applyTitle(summarySheet, tr.summaryTitle, tr.summarySubtitle, 'C')

  summarySheet.columns = [
    { header: tr.metric, key: 'metric', width: 30 },
    { header: tr.value, key: 'value', width: 18 },
    { header: tr.note, key: 'note', width: 64 },
  ]

  summarySheet.addRow([tr.metric, tr.value, tr.note])
  styleHeaderRow(summarySheet.getRow(4))

  const summaryRows = [
    [tr.totalAnswers, totalAnswers, tr.allSavedAnswers],
    [tr.yes, yesCount, tr.positiveAnswers],
    [tr.noProblem, noCount, tr.problemAnswers],
    [tr.na, naCount, tr.excludedAnswers],
    [tr.findings, findingCount, tr.createdFindings],
    [tr.highRisk, highFindings, tr.highRiskFindings],
    [tr.mediumRisk, mediumFindings, tr.mediumRiskFindings],
    [tr.lowRisk, lowFindings, tr.lowRiskFindings],
    [tr.finalScore, `${plan.score ?? 0}%`, statusLabel(plan.status, tr)],
  ]

  summaryRows.forEach((row) => summarySheet.addRow(row))
  styleBodyRows(summarySheet, 5, 4 + summaryRows.length, 1, 3)

  const checklistSheet = workbook.addWorksheet(tr.checklistSheet)
  setupWorksheet(checklistSheet)
  applyTitle(checklistSheet, tr.checklistTitle, tr.checklistSubtitle, 'K')

  checklistSheet.columns = [
    { header: tr.numberColumn, key: 'no', width: 6 },
    { header: tr.type, key: 'type', width: 28 },
    { header: tr.template, key: 'template', width: 26 },
    { header: tr.section, key: 'section', width: 30 },
    { header: tr.question, key: 'question', width: 58 },
    { header: tr.answer, key: 'answer', width: 16 },
    { header: tr.point, key: 'score', width: 10 },
    { header: tr.maxPoint, key: 'max', width: 10 },
    { header: tr.percent, key: 'percent', width: 12 },
    { header: tr.comment, key: 'comment', width: 46 },
    { header: tr.addedBy, key: 'creator', width: 24 },
  ]

  checklistSheet.addRow([
    tr.numberColumn,
    tr.type,
    tr.template,
    tr.section,
    tr.question,
    tr.answer,
    tr.point,
    tr.maxPoint,
    tr.percent,
    tr.comment,
    tr.addedBy,
  ])

  styleHeaderRow(checklistSheet.getRow(4))

    ; (answers || []).forEach((answer: any, index: number) => {
      const templateQuestion = normalizeOne(answer.template_questions)
      const customQuestion = normalizeOne(answer.audit_custom_questions)
      const section = normalizeOne(templateQuestion?.template_sections)
      const template = normalizeOne(section?.audit_templates)
      const customCreator = normalizeOne(customQuestion?.profiles)
      const isCustom = Boolean(answer.custom_question_id)
      const questionText =
        templateQuestion?.question_text || customQuestion?.question_text || '-'
      const maxScore = templateQuestion?.max_score ?? customQuestion?.max_score ?? 10
      const score = Number(answer.score || 0)
      const percent = Number(maxScore || 0) > 0 ? score / Number(maxScore) : 0

 const row = checklistSheet.addRow([
  index + 1,
  isCustom ? tr.customQuestionType : tr.templateQuestionType,
  isCustom ? tr.customQuestion : template?.title || '-',
  isCustom ? tr.customSection : section?.title || '-',
  questionText,
  answerLabel(answer.response, tr),
  score,
  maxScore,
  percent,
  answer.comment || '-',
  isCustom ? customCreator?.full_name || '-' : '-',
])

      row.height = 34
      row.eachCell((cell) => styleBodyCell(cell))
      row.getCell(9).numFmt = '0%'
      applyStatusFill(row.getCell(6), answerLabel(answer.response, tr))
    })

  if ((answers || []).length > 0) {
    checklistSheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + (answers || []).length, column: 11 },
    }
  }

  const findingsSheet = workbook.addWorksheet(tr.findingsSheet)
  setupWorksheet(findingsSheet)
  applyTitle(findingsSheet, tr.findings, tr.findingsSubtitle, 'H')

  findingsSheet.columns = [
    { header: tr.numberColumn, key: 'no', width: 6 },
    { header: tr.title, key: 'title', width: 38 },
    { header: tr.risk, key: 'risk', width: 18 },
    { header: tr.status, key: 'status', width: 18 },
    { header: tr.deadline, key: 'deadline', width: 16 },
    { header: tr.responsible, key: 'owner', width: 26 },
    { header: tr.description, key: 'description', width: 62 },
    { header: tr.files, key: 'files', width: 44 },
  ]

  findingsSheet.addRow([
    tr.numberColumn,
    tr.title,
    tr.risk,
    tr.status,
    tr.deadline,
    tr.responsible,
    tr.description,
    tr.files,
  ])

  styleHeaderRow(findingsSheet.getRow(4))

    ; (findings || []).forEach((finding: any, index: number) => {
      const responsible = normalizeOne(finding.profiles)
      const files = Array.isArray(finding.files)
        ? finding.files.map((file: any) => file.name).join(', ')
        : '-'

      const row = findingsSheet.addRow([
        index + 1,
        finding.title || '-',
        severityLabel(finding.severity, tr),
        findingStatusLabel(finding.status, tr),
        formatDate(finding.deadline),
        responsible?.full_name || '-',
        finding.description || '-',
        files || '-',
      ])

      row.height = 34
      row.eachCell((cell) => styleBodyCell(cell))
      applyStatusFill(row.getCell(3), severityLabel(finding.severity, tr))
      applyStatusFill(row.getCell(4), findingStatusLabel(finding.status, tr))
    })

  if ((findings || []).length > 0) {
    findingsSheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + (findings || []).length, column: 8 },
    }
  }

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          ...cell.alignment,
          vertical: cell.alignment?.vertical || 'middle',
          wrapText: true,
        }
      })
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const fileName = `${safeFileName(plan.title || tr.defaultFileBase)}-${tr.fileSuffix}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}