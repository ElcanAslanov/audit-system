import {createClient} from '@/lib/supabase/server'
import {redirect} from 'next/navigation'
import AuditQuestionsClient from '@/components/audit/audit-questions-client'

function normalizeOne(value: any) {
  return Array.isArray(value) ? value[0] || null : value || null
}

export default async function AuditQuestionsPage() {
  const supabase = await createClient()

  const {
    data: {user},
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const {data: profile} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = String(profile?.role || '').toLowerCase()
  const isAdmin = role === 'admin'

  const {data: rootComments, error: commentsError} = await supabase
    .from('audit_comments')
    .select(`
      id,
      plan_id,
      answer_id,
      question_id,
      sender_id,
      recipient_id,
      type,
      status,
      priority,
      message,
      created_at
    `)
    .is('parent_id', null)
    .order('created_at', {ascending: false})

  if (commentsError) {
    return (
      <div className="p-4 text-red-600 sm:p-6 lg:p-8">
        Sual/rəylər yüklənmədi: {commentsError.message}
      </div>
    )
  }

  const allRootComments = rootComments || []

  const visibleRootComments = isAdmin
    ? allRootComments
    : allRootComments.filter((item: any) => {
        return item.sender_id === user.id || item.recipient_id === user.id
      })

  const rootIds = visibleRootComments.map((item: any) => item.id)
  const planIds = Array.from(
    new Set(visibleRootComments.map((item: any) => item.plan_id).filter(Boolean))
  )
  const answerIds = Array.from(
    new Set(
      visibleRootComments.map((item: any) => item.answer_id).filter(Boolean)
    )
  )
  const userIds = Array.from(
    new Set(
      visibleRootComments
        .flatMap((item: any) => [item.sender_id, item.recipient_id])
        .filter(Boolean)
    )
  )

  let replies: any[] = []

  if (rootIds.length > 0) {
    const {data: replyRows} = await supabase
      .from('audit_comments')
      .select(`
        id,
        parent_id,
        sender_id,
        recipient_id,
        message,
        created_at
      `)
      .in('parent_id', rootIds)
      .order('created_at', {ascending: true})

    replies = replyRows || []

    replies.forEach((reply: any) => {
      if (reply.sender_id) userIds.push(reply.sender_id)
      if (reply.recipient_id) userIds.push(reply.recipient_id)
    })
  }

  const uniqueUserIds = Array.from(new Set(userIds))

  const profilesById = new Map<string, any>()
  const plansById = new Map<string, any>()
  const answersById = new Map<string, any>()

  if (uniqueUserIds.length > 0) {
    const {data: profiles} = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueUserIds)

    ;(profiles || []).forEach((item: any) => {
      profilesById.set(item.id, item)
    })
  }

  if (planIds.length > 0) {
    const {data: plans} = await supabase
      .from('audit_plans')
      .select('id, title')
      .in('id', planIds)

    ;(plans || []).forEach((item: any) => {
      plansById.set(item.id, item)
    })
  }

  if (answerIds.length > 0) {
    const {data: answers} = await supabase
      .from('audit_answers')
      .select('id, comment')
      .in('id', answerIds)

    ;(answers || []).forEach((item: any) => {
      answersById.set(item.id, item)
    })
  }

  const repliesByParentId = new Map<string, any[]>()

  replies.forEach((reply: any) => {
    const sender = profilesById.get(reply.sender_id)

    const normalizedReply = {
      id: reply.id,
      sender_id: reply.sender_id,
      recipient_id: reply.recipient_id,
      message: reply.message,
      created_at: reply.created_at,
      sender_name: sender?.full_name || '-',
    }

    const existing = repliesByParentId.get(reply.parent_id) || []
    existing.push(normalizedReply)
    repliesByParentId.set(reply.parent_id, existing)
  })

  const comments = visibleRootComments.map((item: any) => {
    const plan = plansById.get(item.plan_id)
    const answer = answersById.get(item.answer_id)
    const sender = profilesById.get(item.sender_id)
    const recipient = profilesById.get(item.recipient_id)

    return {
      id: item.id,
      plan_id: item.plan_id,
      answer_id: item.answer_id,
      question_id: item.question_id,
      sender_id: item.sender_id,
      recipient_id: item.recipient_id,
      type: item.type,
      status: item.status,
      priority: item.priority,
      message: item.message,
      created_at: item.created_at,
      sender_name: sender?.full_name || '-',
      recipient_name: recipient?.full_name || '-',
      plan_title: plan?.title || '-',
      answer_text: answer?.comment || '',
      replies: repliesByParentId.get(item.id) || [],
    }
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
          Audit sualları
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Audit raporları üzrə verilən sual və rəyləri buradan izləyin.
        </p>
      </div>

      <AuditQuestionsClient currentUserId={user.id} comments={comments} />
    </div>
  )
}