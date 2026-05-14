import {Resend} from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom =
  process.env.AUDIT_EMAIL_FROM || 'Audit Sistemi <onboarding@resend.dev>'
const testTo = process.env.AUDIT_EMAIL_TEST_TO || ''

const resend = resendApiKey ? new Resend(resendApiKey) : null

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({to, subject, html, text}: SendEmailInput) {
  if (!resend) {
    console.warn('RESEND_API_KEY tapılmadı. Email göndərilmədi.')
    return {
      success: false,
      error: 'RESEND_API_KEY tapılmadı.',
    }
  }

  if (!to) {
    return {
      success: false,
      error: 'Email ünvanı boşdur.',
    }
  }

  const finalTo = testTo || to
  const isTestRedirect = Boolean(testTo && testTo !== to)

  const finalHtml = isTestRedirect
    ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; margin-bottom: 16px; padding: 12px; border: 1px solid #fde68a; background: #fffbeb; border-radius: 10px;">
        <b>Test rejimi:</b> Bu email əslində <b>${to}</b> ünvanına göndərilməli idi.
      </div>
      ${html}
    `
    : html

  const finalText = isTestRedirect
    ? `Test rejimi: Bu email əslində ${to} ünvanına göndərilməli idi.\n\n${text || ''}`
    : text

  const {data, error} = await resend.emails.send({
    from: emailFrom,
    to: finalTo,
    subject,
    html: finalHtml,
    text: finalText,
  })

  if (error) {
    console.error('Email göndərilmədi:', error)
    return {
      success: false,
      error: error.message || 'Email göndərilmədi.',
    }
  }

  return {
    success: true,
    data,
  }
}