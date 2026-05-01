import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

type RouteProps = {
  params: Promise<{ id: string }>
}

function normalizeOne(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null
}

function answerLabel(value?: string | null) {
  if (value === 'yes') return 'Bəli'
  if (value === 'no') return 'Xeyr'
  if (value === 'na') return 'N/A'
  return '-'
}

function statusLabel(value?: string | null) {
  if (value === 'tamamlandi') return 'Tamamlandı'
  if (value === 'needs_attention') return 'Diqqət tələb edir'
  if (value === 'planlanan') return 'Planlanan'
  return value || '-'
}

function findingStatusLabel(value?: string | null) {
  if (value === 'aciq') return 'Açıq'
  if (value === 'icrada') return 'İcrada'
  if (value === 'hell_olundu') return 'Həll olundu'
  return value || '-'
}

function severityLabel(value?: string | null) {
  if (value === 'high') return 'High Risk'
  if (value === 'medium') return 'Medium Risk'
  if (value === 'low') return 'Low Risk'
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

  if (label.includes('tamamlandı') || label.includes('bəli') || label.includes('həll')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: normalizeColor('#DCFCE7') }
    cell.font = { name: FONT_BODY, size: 10, bold: true, color: normalizeColor('#166534') }
    return
  }

  if (label.includes('xeyr') || label.includes('problem') || label.includes('high')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: normalizeColor('#FEE2E2') }
    cell.font = { name: FONT_BODY, size: 10, bold: true, color: normalizeColor('#991B1B') }
    return
  }

  if (label.includes('medium') || label.includes('diqqət') || label.includes('icrada')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: normalizeColor('#FEF3C7') }
    cell.font = { name: FONT_BODY, size: 10, bold: true, color: normalizeColor('#92400E') }
    return
  }

  if (label.includes('n/a') || label.includes('açıq')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: normalizeColor('#F1F5F9') }
    cell.font = { name: FONT_BODY, size: 10, bold: true, color: normalizeColor('#475569') }
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

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'İstifadəçi tapılmadı.' }, { status: 401 })
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
    return NextResponse.json({ error: 'Audit tapılmadı.' }, { status: 404 })
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
      { error: 'Bu audit planına baxış kilidlənib.' },
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
              ? `${template?.title || 'Şablon'} / ${section.title}`
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

  const overviewSheet = workbook.addWorksheet('Overview')
  setupWorksheet(overviewSheet)
  applyTitle(
    overviewSheet,
    'Audit Hesabatı',
    'Plan məlumatları, KPI-lar və ümumi nəticələr',
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

  overviewSheet.getCell('A4').value = 'Plan məlumatları'
  overviewSheet.mergeCells('A4:B4')
  styleSectionLabel(overviewSheet.getCell('A4'))

  const overviewRows = [
    ['Plan', plan.title || '-'],
    ['Şirkət', normalizedCompany?.name || '-'],
    ['Departament', plan.department || '-'],
    ['Şablonlar', selectedTemplateNames],
    ['Seçilmiş bölmələr', selectedSectionNames],
    ['Status', statusLabel(plan.status)],
    ['Score', `${plan.score ?? 0}%`],
    ['Son tarix', formatDate(plan.due_date)],
    ['Yaradan', creatorProfile?.full_name || '-'],
    ['Qeydlər', plan.notes || '-'],
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

  overviewSheet.getCell('D4').value = 'KPI xülasəsi'
  overviewSheet.mergeCells('D4:F4')
  styleSectionLabel(overviewSheet.getCell('D4'))

  const kpiRows = [
    ['Ümumi cavab', totalAnswers, '#EAF2FF'],
    ['Bəli', yesCount, '#DCFCE7'],
    ['Xeyr / Problem', noCount, '#FEE2E2'],
    ['N/A', naCount, '#F1F5F9'],
    ['Tapıntılar', findingCount, '#FEF3C7'],
    ['High risk', highFindings, '#FEE2E2'],
    ['Medium risk', mediumFindings, '#FEF3C7'],
    ['Low risk', lowFindings, '#DCFCE7'],
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

  const summarySheet = workbook.addWorksheet('Summary')
  setupWorksheet(summarySheet)
  applyTitle(summarySheet, 'Audit Summary', 'Cavab, risk və tapıntı statistikası', 'C')

  summarySheet.columns = [
    { header: 'Metrik', key: 'metric', width: 30 },
    { header: 'Dəyər', key: 'value', width: 18 },
    { header: 'Qeyd', key: 'note', width: 64 },
  ]

  summarySheet.addRow(['Metrik', 'Dəyər', 'Qeyd'])
  styleHeaderRow(summarySheet.getRow(4))

  const summaryRows = [
    ['Ümumi cavab', totalAnswers, 'Auditdə yadda saxlanılan bütün cavablar'],
    ['Bəli', yesCount, 'Uyğun cavablar'],
    ['Xeyr / Problem', noCount, 'Problemli cavablar'],
    ['N/A', naCount, 'Qiymətləndirməyə daxil edilməyən cavablar'],
    ['Tapıntılar', findingCount, 'Audit üzrə yaradılmış tapıntılar'],
    ['High risk', highFindings, 'Yüksək riskli tapıntılar'],
    ['Medium risk', mediumFindings, 'Orta riskli tapıntılar'],
    ['Low risk', lowFindings, 'Aşağı riskli tapıntılar'],
    ['Final score', `${plan.score ?? 0}%`, statusLabel(plan.status)],
  ]

  summaryRows.forEach((row) => summarySheet.addRow(row))
  styleBodyRows(summarySheet, 5, 4 + summaryRows.length, 1, 3)

  const checklistSheet = workbook.addWorksheet('Checklist')
  setupWorksheet(checklistSheet)
  applyTitle(
    checklistSheet,
    'Checklist Cavabları',
    'Hər sual üzrə şablon, bölmə, cavab, bal və şərh detalları',
    'K'
  )

  checklistSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tip', key: 'type', width: 28 },
    { header: 'Şablon', key: 'template', width: 26 },
    { header: 'Bölmə', key: 'section', width: 30 },
    { header: 'Sual', key: 'question', width: 58 },
    { header: 'Cavab', key: 'answer', width: 16 },
    { header: 'Bal', key: 'score', width: 10 },
    { header: 'Max bal', key: 'max', width: 10 },
    { header: 'Faiz', key: 'percent', width: 12 },
    { header: 'Şərh', key: 'comment', width: 46 },
    { header: 'Əlavə edən', key: 'creator', width: 24 },
  ]

  checklistSheet.addRow([
    'No',
    'Tip',
    'Şablon',
    'Bölmə',
    'Sual',
    'Cavab',
    'Bal',
    'Max bal',
    'Faiz',
    'Şərh',
    'Əlavə edən',
  ])

  styleHeaderRow(checklistSheet.getRow(4))

  ;(answers || []).forEach((answer: any, index: number) => {
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
      isCustom ? 'Auditor tərəfindən əlavə edilib' : 'Şablon sualı',
      isCustom ? 'Xüsusi sual' : template?.title || '-',
      isCustom ? 'Auditor tərəfindən əlavə edilən suallar' : section?.title || '-',
      questionText,
      answerLabel(answer.response),
      score,
      maxScore,
      percent,
      answer.comment || '-',
      isCustom ? customCreator?.full_name || '-' : '-',
    ])

    row.height = 34
    row.eachCell((cell) => styleBodyCell(cell))
    row.getCell(9).numFmt = '0%'
    applyStatusFill(row.getCell(6), answerLabel(answer.response))
  })

  if ((answers || []).length > 0) {
    checklistSheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + (answers || []).length, column: 11 },
    }
  }

  const findingsSheet = workbook.addWorksheet('Findings')
  setupWorksheet(findingsSheet)
  applyTitle(
    findingsSheet,
    'Tapıntılar',
    'Risklər, statuslar, cavabdeh şəxslər, son tarix və fayl məlumatları',
    'H'
  )

  findingsSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Başlıq', key: 'title', width: 38 },
    { header: 'Risk', key: 'risk', width: 18 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Son tarix', key: 'deadline', width: 16 },
    { header: 'Cavabdeh', key: 'owner', width: 26 },
    { header: 'Təsvir', key: 'description', width: 62 },
    { header: 'Fayllar', key: 'files', width: 44 },
  ]

  findingsSheet.addRow([
    'No',
    'Başlıq',
    'Risk',
    'Status',
    'Son tarix',
    'Cavabdeh',
    'Təsvir',
    'Fayllar',
  ])

  styleHeaderRow(findingsSheet.getRow(4))

  ;(findings || []).forEach((finding: any, index: number) => {
    const responsible = normalizeOne(finding.profiles)
    const files = Array.isArray(finding.files)
      ? finding.files.map((file: any) => file.name).join(', ')
      : '-'

    const row = findingsSheet.addRow([
      index + 1,
      finding.title || '-',
      severityLabel(finding.severity),
      findingStatusLabel(finding.status),
      formatDate(finding.deadline),
      responsible?.full_name || '-',
      finding.description || '-',
      files || '-',
    ])

    row.height = 34
    row.eachCell((cell) => styleBodyCell(cell))
    applyStatusFill(row.getCell(3), severityLabel(finding.severity))
    applyStatusFill(row.getCell(4), findingStatusLabel(finding.status))
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
  const fileName = `${safeFileName(plan.title)}-hesabat.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}