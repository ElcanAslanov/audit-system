import {createClient} from '@/lib/supabase/server'
import {redirect} from 'next/navigation'
import NotificationsClient from '@/components/notifications/notifications-client'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const {data: notifications, error} = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      title,
      body,
      related_table,
      related_id,
      related_plan_id,
      is_read,
      created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', {ascending: false})
    .limit(100)

  if (error) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Bildirişlər yüklənmədi: {error.message}
      </div>
    )
  }

  const rows = notifications || []

  const planIds = Array.from(
    new Set(rows.map((item: any) => item.related_plan_id).filter(Boolean))
  )

  const rootCommentIds = Array.from(
    new Set(rows.map((item: any) => item.related_id).filter(Boolean))
  )

  const plansById = new Map<string, any>()
  const commentsById = new Map<string, any>()
  const answersById = new Map<string, any>()
  const questionsById = new Map<string, any>()

  if (planIds.length > 0) {
    const {data: plans} = await supabase
      .from('audit_plans')
      .select('id, title, department')
      .in('id', planIds)

    ;(plans || []).forEach((plan: any) => {
      plansById.set(plan.id, plan)
    })
  }

  if (rootCommentIds.length > 0) {
    const {data: comments} = await supabase
      .from('audit_comments')
      .select(`
        id,
        plan_id,
        answer_id,
        question_id,
        type,
        status,
        priority,
        message,
        created_at
      `)
      .in('id', rootCommentIds)

    ;(comments || []).forEach((comment: any) => {
      commentsById.set(comment.id, comment)
    })
  }

  const answerIds = Array.from(
    new Set(
      Array.from(commentsById.values())
        .map((comment: any) => comment.answer_id)
        .filter(Boolean)
    )
  )

  const questionIds = Array.from(
    new Set(
      Array.from(commentsById.values())
        .map((comment: any) => comment.question_id)
        .filter(Boolean)
    )
  )

  if (answerIds.length > 0) {
    const {data: answers} = await supabase
      .from('audit_answers')
      .select('id, response, comment, score, question_id')
      .in('id', answerIds)

    ;(answers || []).forEach((answer: any) => {
      answersById.set(answer.id, answer)

      if (answer.question_id && !questionIds.includes(answer.question_id)) {
        questionIds.push(answer.question_id)
      }
    })
  }

  if (questionIds.length > 0) {
    const {data: questions} = await supabase
      .from('template_questions')
      .select('id, question_text')
      .in('id', questionIds)

    ;(questions || []).forEach((question: any) => {
      questionsById.set(question.id, question)
    })
  }

  const preparedRows = rows.map((item: any) => {
    const plan = plansById.get(item.related_plan_id)
    const comment = commentsById.get(item.related_id)
    const answer = comment?.answer_id ? answersById.get(comment.answer_id) : null
    const questionId = comment?.question_id || answer?.question_id
    const question = questionId ? questionsById.get(questionId) : null

    const reportHref =
      item.related_plan_id && comment?.answer_id
        ? `/dashboard/plans/${item.related_plan_id}/report?answer=${comment.answer_id}`
        : item.related_plan_id
          ? `/dashboard/plans/${item.related_plan_id}/report`
          : ''

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      related_table: item.related_table,
      related_id: item.related_id,
      related_plan_id: item.related_plan_id,
      is_read: item.is_read,
      created_at: item.created_at,
      plan_title: plan?.title || 'Audit raporu',
      plan_department: plan?.department || null,
      question_text: question?.question_text || null,
      answer_response: answer?.response || null,
      answer_score: answer?.score ?? null,
      answer_comment: answer?.comment || null,
      comment_type: comment?.type || null,
      report_href: reportHref,
    }
  })

  return <NotificationsClient initialRows={preparedRows} />
}