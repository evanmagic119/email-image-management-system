// app/api/emails/auto-reply/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const data = await req.json()
  const {
    subject,
    body,
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
      !('isUsingLatestImage' in data) &&
      !('imageUrl' in data) &&
      !('replyTime' in data) &&
      !('isActive' in data)

    if (isOnlyUpdatingAttachment) {
      const setting = await prisma.autoReplySetting.upsert({
        where: { id: 1 },
        update: {
          attachmentUrl // 支持 null
        },
        create: {
          id: 1,
          subject: '',
          body: '',
          isUsingLatestImage: false,
          imageUrl: null,
          attachmentUrl,
          replyTime: '00:00',
          isActive: false
        }
      })

      return NextResponse.json({ success: true, setting })
    }

    // 其余字段必须完整才执行完整保存
    if (
      !subject ||
      !body ||
      isUsingLatestImage === undefined ||
      isActive === undefined ||
      !replyTime
    ) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    const setting = await prisma.autoReplySetting.upsert({
      where: { id: 1 },
      update: {
        subject,
        body,
        isUsingLatestImage,
        imageUrl: imageUrl || null,
        attachmentUrl: attachmentUrl ?? null, // 支持 null 和 undefined
        replyTime,
        isActive
      },
      create: {
        id: 1,
        subject,
        body,
        isUsingLatestImage,
        imageUrl: imageUrl || null,
        attachmentUrl: attachmentUrl ?? null,
        replyTime,
        isActive
      }
    })

    return NextResponse.json({ success: true, setting })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
