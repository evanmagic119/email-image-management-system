import { NextRequest, NextResponse } from 'next/server'
import formidable, { File } from 'formidable'
import { Readable } from 'stream'
import nodemailer from 'nodemailer'
import type { Attachment } from 'nodemailer/lib/mailer'
import { IncomingMessage } from 'node:http'

// 🔄 读取原始 Request 的 Buffer
async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader()
  const chunks: Uint8Array[] = []

  if (!reader) return Buffer.alloc(0)

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  return Buffer.concat(chunks)
}

// ✅ Main POST Handler
export async function POST(req: NextRequest) {
  const bodyBuffer = await getRawBody(req)

  const fakeReq = Object.assign(Readable.from(bodyBuffer), {
    headers: Object.fromEntries(req.headers.entries())
  })

  const form = formidable({ multiples: true, keepExtensions: true })

  const { fields, files } = await new Promise<{
    fields: formidable.Fields
    files: formidable.Files
  }>((resolve, reject) => {
    form.parse(fakeReq as IncomingMessage, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })

  try {
    const getFieldString = (field: string | string[] | undefined): string => {
      if (typeof field === 'string') return field
      if (Array.isArray(field)) return field[0]
      return ''
    }

    const recipientsRaw = getFieldString(fields.recipients)
    const subject = getFieldString(fields.subject)
    const body = getFieldString(fields.body)
    const attachmentUrl = getFieldString(fields.attachmentUrl)
    const attachmentName = getFieldString(fields.attachmentName)

    let recipients: string[] = []
    try {
      recipients = JSON.parse(recipientsRaw || '[]')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to parse recipients JSON:', message)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format for recipients' }),
        {
          status: 400
        }
      )
    }

    if (!recipients.length || !subject || !body) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: recipients, subject, or body'
        }),
        { status: 400 }
      )
    }

    // 🧷 收集本地上传附件
    const rawFiles = files.attachments
    const fileList: File[] = Array.isArray(rawFiles)
      ? rawFiles
      : rawFiles
        ? [rawFiles as File]
        : []

    const attachments: Attachment[] = fileList.map(file => ({
      filename: file.originalFilename || 'attachment',
      path: file.filepath
    }))

    // 🌐 添加远程 R2 附件（通过 URL 下载）
    if (attachmentUrl && attachmentName) {
      try {
        const res = await fetch(attachmentUrl)
        if (!res.ok) throw new Error('Failed to download remote attachment')

        const arrayBuffer = await res.arrayBuffer()
        attachments.push({
          filename: attachmentName,
          content: Buffer.from(arrayBuffer)
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ status: 'error', message }, { status: 500 })
      }
    }

    // ✉️ 使用 nodemailer 发送
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!
      }
    })

    const info = await transporter.sendMail({
      from: `"Evan Zhang" <${process.env.EMAIL_USER!}>`,
      to: recipients.join(','),
      subject,
      html: body,
      attachments
    })

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
