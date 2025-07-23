import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { getPendingRecipients } from '@/lib/getPendingRecipients'

const prisma = new PrismaClient()

export async function GET() {
  const setting = await prisma.autoReplySetting.findUnique({
    where: { id: 1 }
  })

  if (!setting || !setting.isActive) {
    return NextResponse.json({ status: 'skipped', reason: 'Not active' })
  }

  const now = new Date()
  const [hour, minute] = setting.replyTime.split(':').map(Number)
  const todayTarget = new Date()
  todayTarget.setHours(hour, minute, 0, 0)
  console.log('now', now)
  console.log('todayTarget', todayTarget)
  if (now < todayTarget) {
    return NextResponse.json({ status: 'pending', reason: 'Time not reached' })
  }

  try {
    const recipients = await getPendingRecipients()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!
      }
    })

    if (recipients.length === 0) {
      await transporter.sendMail({
        from: `"AutoReply System" <${process.env.EMAIL_USER!}>`,
        to: process.env.EMAIL_USER!,
        subject: '📭 自动回复提醒：无可回复收件人',
        html: `<p>过去12小时内，没有需要自动回复的发件人。</p>`
      })

      return NextResponse.json({ status: 'no-recipients' })
    }

    // ✅ 发送正式自动回复邮件
    await transporter.sendMail({
      from: `"Evan Zhang" <${process.env.EMAIL_USER!}>`,
      to: process.env.EMAIL_USER!,
      bcc: recipients,
      subject: setting.subject,
      html: setting.body,
      attachments: setting.attachmentUrl
        ? [
            {
              filename: decodeURIComponent(
                setting.attachmentUrl.split('/').pop() || 'attachment'
              ),
              path: setting.attachmentUrl
            }
          ]
        : undefined
    })

    await transporter.sendMail({
      from: `"AutoReply System" <${process.env.EMAIL_USER!}>`,
      to: process.env.EMAIL_USER!,
      subject: '✅ 自动回复已发送',
      html: `
        <p>自动回复已成功发送给以下 ${recipients.length} 位用户：</p>
        <ul>
          ${recipients.map(email => `<li>${email}</li>`).join('')}
        </ul>
        <p>主题：<strong>${setting.subject}</strong></p>
      `
    })

    // ✅ 更新状态为非激活
    await prisma.autoReplySetting.update({
      where: { id: 1 },
      data: { isActive: false }
    })

    return NextResponse.json({ status: 'sent', recipients })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
