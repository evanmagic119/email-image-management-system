import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DateTime } from 'luxon'

export async function POST(req: NextRequest) {
  const data = await req.json()

  const {
    subject,
    body,
    rawBody,
    mode,
    isUsingLatestImage,
    imageUrl,
    attachmentUrl,
    replyTime,
    isActive
  } = data

  try {
    const isOnlyUpdatingAttachment =
      'attachmentUrl' in data &&
      !('subject' in data) &&
      !('body' in data) &&
      !('rawBody' in data) &&
      !('mode' in data) &&
      !('isUsingLatestImage' in data) &&
      !('imageUrl' in data) &&
      !('replyTime' in data) &&
      !('isActive' in data)

    let setting

    if (isOnlyUpdatingAttachment) {
      setting = await prisma.autoReplySetting.upsert({
        where: { id: 1 },
        update: { attachmentUrl },
        create: {
          id: 1,
          subject: '',
          body: '',
          rawBody: null,
          mode: 'editor',
          isUsingLatestImage: false,
          imageUrl: null,
          attachmentUrl,
          replyTime: '00:00@UTC',
          isActive: false
        }
      })

      return NextResponse.json({ success: true, setting })
    }

    if (
      !subject ||
      (!body && !rawBody) ||
      isUsingLatestImage === undefined ||
      isActive === undefined ||
      !replyTime ||
      !mode
    ) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    // ✅ 处理 replyTime 加上日期
    const [timeStr, timeZone] = replyTime.split('@')
    const [hour, minute] = timeStr.split(':').map(Number)

    const now = DateTime.now().setZone(timeZone || 'UTC')
    let targetTime = now.set({ hour, minute, second: 0, millisecond: 0 })

    if (now >= targetTime) {
      targetTime = targetTime.plus({ days: 1 }) // 已过则设为明天
    }

    const fullReplyTime = `${targetTime.toFormat("yyyy-MM-dd'T'HH:mm")}@${timeZone}`

    setting = await prisma.autoReplySetting.upsert({
      where: { id: 1 },
      update: {
        subject,
        body,
        rawBody,
        mode,
        isUsingLatestImage,
        imageUrl: imageUrl || null,
        attachmentUrl: attachmentUrl ?? null,
        replyTime: fullReplyTime,
        isActive
      },
      create: {
        id: 1,
        subject,
        body,
        rawBody,
        mode,
        isUsingLatestImage,
        imageUrl: imageUrl || null,
        attachmentUrl: attachmentUrl ?? null,
        replyTime: fullReplyTime,
        isActive
      }
    })

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
      success: true,
      setting,
      nextSendIn,
      nextSendAt: targetTime.toFormat('yyyy-MM-dd HH:mm')
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
