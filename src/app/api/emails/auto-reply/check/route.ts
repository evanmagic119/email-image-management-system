import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { getPendingRecipients } from '@/lib/getPendingRecipients'
import axios from 'axios'
import { DateTime } from 'luxon'

const prisma = new PrismaClient()

export async function GET() {
  const setting = await prisma.autoReplySetting.findUnique({
    where: { id: 1 }
  })

  if (!setting || !setting.isActive) {
    return NextResponse.json({ status: 'skipped', reason: 'Not active' })
  }

  // ✅ 新格式："2025-07-28T23:00@America/Toronto"
  const [dateTimeStr, timeZone] = setting.replyTime.split('@')
  const targetTime = DateTime.fromISO(dateTimeStr, { zone: timeZone || 'UTC' })
  const now = DateTime.now().setZone(timeZone || 'UTC')

  if (now < targetTime) {
    const diffMinutes = Math.round(targetTime.diff(now, 'minutes').minutes)

    let nextSendIn = ''
    if (diffMinutes < 60) {
      nextSendIn = `${diffMinutes} 分钟`
    } else {
      const h = Math.floor(diffMinutes / 60)
      const m = diffMinutes % 60
      nextSendIn = m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`
    }

    return NextResponse.json({
      status: 'pending',
      reason: 'Time not reached',
      nextSendIn
    })
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
        html: `<p>过去1小时内，没有需要自动回复的发件人。</p>`
      })

      await prisma.autoReplySetting.update({
        where: { id: 1 },
        data: { isActive: false }
      })

      return NextResponse.json({ status: 'no-recipients' })
    }

    let attachments
    if (setting.attachmentUrl) {
      const filename = decodeURIComponent(
        setting.attachmentUrl.split('/').pop() || 'attachment'
      )

      const fileResponse = await axios.get(setting.attachmentUrl, {
        responseType: 'arraybuffer'
      })

      attachments = [
        {
          filename,
          content: fileResponse.data
        }
      ]
    }

    let html = setting.mode === 'html' ? setting.rawBody || '' : setting.body
    if (setting.isUsingLatestImage && setting.imageUrl) {
      const alreadyHasImage = html.includes(setting.imageUrl)
      if (!alreadyHasImage) {
        const imageTag = `<p><img src="${setting.imageUrl}" style="max-width: 100%; width: 400px; height: auto; display: block; margin: 12px 0;" /></p>`
        html += imageTag
      }
    }

    await transporter.sendMail({
      from: `"Evan Zhang" <${process.env.EMAIL_USER!}>`,
      bcc: recipients,
      subject: setting.subject,
      html,
      attachments
    })

    await transporter.sendMail({
      from: `"AutoReply System" <${process.env.EMAIL_USER!}>`,
      to: process.env.EMAIL_USER!,
      subject: '✅ 自动回复已发送',
      html: `
        <p>自动回复已成功发送给以下 ${recipients.length} 位用户：</p>
        <ul>${recipients.map(email => `<li>${email}</li>`).join('')}</ul>
        <p>主题：<strong>${setting.subject}</strong></p>
      `
    })

    await prisma.autoReplySetting.update({
      where: { id: 1 },
      data: { isActive: false }
    })

    return NextResponse.json({ status: 'sent', recipients })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('发送失败:', err)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
