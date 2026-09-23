import nodemailer from 'nodemailer'
import { getSiteSettings } from './site-settings'

export type MailProvider = 'smtp' | 'resend' | 'log'

export interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

function brandHtml(opts: {
  siteName: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}) {
  const { siteName, title, bodyHtml, ctaLabel, ctaUrl } = opts
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:28px 0 8px"><a href="${ctaUrl}" style="display:inline-block;background:#8b1a1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">${ctaLabel}</a></p>`
      : ''
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0f0;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0e0e0">
        <tr><td style="background:linear-gradient(135deg,#4a0e0e,#8b1a1a);padding:28px 24px;text-align:center">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:0.02em">${siteName}</p>
        </td></tr>
        <tr><td style="padding:28px 24px 8px">
          <h1 style="margin:0 0 12px;font-size:20px;color:#1a1212;line-height:1.3">${title}</h1>
          <div style="color:#4a4040;font-size:15px;line-height:1.65">${bodyHtml}</div>
          ${cta}
        </td></tr>
        <tr><td style="padding:16px 24px 28px">
          <p style="margin:0;font-size:12px;color:#a09090;line-height:1.5">If you did not request this, you can ignore this email.</p>
        </td></tr>
        <tr><td style="background:#faf4f4;padding:14px 24px;text-align:center;border-top:1px solid #f0e0e0">
          <p style="margin:0;font-size:11px;color:#a88888">© ${new Date().getFullYear()} ${siteName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function verificationEmailHtml(siteName: string, code: string, verifyUrl?: string) {
  return brandHtml({
    siteName,
    title: 'Verify your email',
    bodyHtml: `<p>Thanks for signing up. Use this code to verify your account:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:0.2em;color:#8b1a1a;margin:16px 0">${code}</p>
      <p style="font-size:13px;color:#6b5555">This code expires in 30 minutes.</p>`,
    ctaLabel: verifyUrl ? 'Verify email' : undefined,
    ctaUrl: verifyUrl,
  })
}

export function ticketReplyEmailHtml(
  siteName: string,
  subject: string,
  replyPreview: string,
  ticketUrl: string
) {
  return brandHtml({
    siteName,
    title: 'New reply on your ticket',
    bodyHtml: `<p><strong>${subject}</strong></p><p style="background:#faf4f4;border-radius:10px;padding:12px;border:1px solid #f0e0e0">${replyPreview}</p>`,
    ctaLabel: 'View ticket',
    ctaUrl: ticketUrl,
  })
}

export function reportNotifyEmailHtml(
  siteName: string,
  title: string,
  reason: string,
  entityId: string
) {
  return brandHtml({
    siteName,
    title: 'New media report',
    bodyHtml: `<p>A user reported <strong>${title || entityId}</strong>.</p>
      <p>Reason: <strong>${reason}</strong></p>
      <p style="font-size:13px;color:#6b5555">Entity ID: ${entityId}</p>`,
  })
}

export async function sendMail(opts: SendMailOptions): Promise<{ ok: boolean; error?: string }> {
  const settings = await getSiteSettings()
  const provider = (settings.mail_provider || 'log') as MailProvider
  const from =
    settings.mail_from ||
    settings.mail_from_email ||
    `noreply@${(settings.seo_canonical_base || 'localhost').replace(/^https?:\/\//, '').split('/')[0]}`
  const fromName = settings.mail_from_name || settings.site_name || 'Telegram Directory'
  const fromHeader = `"${fromName}" <${from}>`

  if (provider === 'log') {
    console.log('[mail:log]', { to: opts.to, subject: opts.subject, from: fromHeader })
    return { ok: true }
  }

  if (provider === 'resend') {
    const apiKey = settings.mail_resend_api_key
    if (!apiKey) return { ok: false, error: 'Resend API key not configured' }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        return { ok: false, error: err.slice(0, 300) }
      }
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Resend failed' }
    }
  }

  // smtp (custom / Thundermail-compatible / PHP mail relay via SMTP)
  const host = settings.mail_smtp_host
  const port = parseInt(settings.mail_smtp_port || '587', 10)
  if (!host) return { ok: false, error: 'SMTP host not configured' }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: settings.mail_smtp_secure === '1' || port === 465,
      auth:
        settings.mail_smtp_user
          ? {
              user: settings.mail_smtp_user,
              pass: settings.mail_smtp_pass || '',
            }
          : undefined,
    })
    await transporter.sendMail({
      from: fromHeader,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'SMTP send failed' }
  }
}
