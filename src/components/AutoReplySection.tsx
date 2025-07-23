'use client'

import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  MenuItem,
  Select,
  IconButton,
  Stack,
  Tooltip,
  RadioGroup,
  Radio,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter'
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import DeleteIcon from '@mui/icons-material/Delete'
import CodeIcon from '@mui/icons-material/Code'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import FontSize from '@tiptap/extension-font-size'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import LoadingBackdrop from '@/components/LoadingBackdrop'
import { useLatestImage } from '@/context/LatestImageContext'
import { uploadToR2 } from '@/lib/uploadToR2'

export function AutoReplySection() {
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recentSenders, setRecentSenders] = useState<string[] | null>(null)
  const [loadingSenders, setLoadingSenders] = useState(false)
  const [font, setFont] = useState('Arial')
  const [color, setColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [fontSize, setFontSize] = useState('16px')
  const [showHtml, setShowHtml] = useState(false)
  const [attachment, setAttachment] = useState<{
    file: File
    url: string
  } | null>(null)

  const [isActive, setIsActive] = useState(true)
  const [replyTime, setReplyTime] = useState<Dayjs | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isUsingLatestImage, setIsUsingLatestImage] = useState(true)
  const { latestImage } = useLatestImage()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          style:
            'max-width: 100%; width: 400px; height: auto; display: block; margin: 12px 0; resize: both; overflow: auto;',
          draggable: 'true'
        }
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] })
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setBody(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style:
          'min-height:200px;padding:8px;border:1px solid #ccc;border-radius:6px;'
      }
    },
    immediatelyRender: false
  })

  useEffect(() => {
    const fetchRecentSenders = async () => {
      setLoadingSenders(true)
      try {
        const res = await fetch('/api/emails/pending-recipients')
        const data = await res.json()
        const senders: string[] = data.emails || []
        setRecentSenders(senders)
        setRecipient(senders.join(', '))
      } catch (err) {
        console.error('最近发件人获取失败', err)
      } finally {
        setLoadingSenders(false)
      }
    }

    fetchRecentSenders()
  }, [])

  const handleSend = async () => {
    const recipients = recipient
      .split(',')
      .map(r => r.trim())
      .filter(email => email.length > 0)

    if (recipients.length === 0) {
      alert('请填写至少一个有效的收件人地址')
      return
    }

    if (!subject.trim()) {
      alert('请填写邮件主题')
      return
    }

    let html = editor?.getHTML() || ''
    const isEmptyHtml =
      html.replace(/<p>(<br\s*\/?>|\s|&nbsp;)*<\/p>/gi, '').trim() === ''

    if (isEmptyHtml) {
      alert('请填写邮件正文')
      return
    }

    // ✅ 如果启用了“插入最新图片”功能，则附加图片到正文末尾
    if (isUsingLatestImage && latestImage?.url) {
      const imageTag = `<p><img src="${latestImage.url}" style="max-width: 100%; width: 400px; height: auto; display: block; margin: 12px 0;" /></p>`
      html += imageTag
    }

    const formData = new FormData()
    formData.append('recipients', JSON.stringify(recipients))
    formData.append('subject', subject)
    formData.append('body', html)

    if (attachment) {
      formData.append('attachmentUrl', attachment.url)
      formData.append('attachmentName', attachment.file.name)
    }

    try {
      setIsLoading(true)
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        alert('✅ 邮件发送成功！')
      } else {
        alert('❌ 发送失败: ' + (data.error || '未知错误'))
      }
    } catch (err) {
      console.error('❌ 网络错误:', err)
      alert('❌ 网络错误，发送失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchInitialSetting = async () => {
      try {
        const res = await fetch('/api/emails/auto-reply/get')
        const json = await res.json()
        if (!json.exists) return

        const {
          subject,
          body,
          isUsingLatestImage,
          attachmentUrl,
          replyTime,
          isActive
        } = json.data

        setSubject(subject)
        setBody(body)
        setIsUsingLatestImage(isUsingLatestImage)
        setReplyTime(dayjs(replyTime, 'HH:mm'))
        setIsActive(isActive)

        if (editor) {
          editor.commands.setContent(body)
        }

        if (attachmentUrl) {
          const filename = decodeURIComponent(
            attachmentUrl.split('/').pop() || ''
          )
          setAttachment({
            file: new File([], filename),
            url: attachmentUrl
          })
        }
      } catch (err) {
        console.error('加载设置失败:', err)
      }
    }

    fetchInitialSetting()
  }, [editor])

  const handleSave = async () => {
    if (!replyTime) return alert('请选择时间')
    if (!subject || !editor) return alert('请填写完整内容')

    const html = editor.getHTML()

    try {
      setIsLoading(true)
      const res = await fetch('/api/emails/auto-reply/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body: html,
          isUsingLatestImage,
          imageUrl: isUsingLatestImage && latestImage ? latestImage.url : null,
          attachmentUrl: attachment?.url || null,
          replyTime: replyTime?.format('HH:mm') || '',
          isActive
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert('设置已保存！')
      } else {
        alert('保存失败：' + data.error)
      }
    } catch (err) {
      console.error('保存出错:', err)
      alert('网络错误，保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      display='flex'
      flexDirection='column'
      gap={3}
      sx={{
        width: '100%',
        maxWidth: '900px',
        mx: 'auto',
        my: 2,
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {loadingSenders ? (
        <Box
          height={40}
          display='flex'
          alignItems='center'
          justifyContent='center'
          border='1px solid #ccc'
          borderRadius={1}
        >
          <CircularProgress size={20} />
        </Box>
      ) : (
        <TextField
          label='收件人（多个用逗号隔开）'
          size='small'
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          fullWidth
        />
      )}

      {recentSenders &&
        recentSenders.length > 0 &&
        recipient.trim() === recentSenders.join(', ') && (
          <Typography variant='body2' color='text.secondary'>
            来源：自动读取过去1小时内的发件人
          </Typography>
        )}

      <TextField
        label='主题'
        size='small'
        value={subject}
        onChange={e => setSubject(e.target.value)}
        fullWidth
      />

      <Stack
        direction='row'
        spacing={1}
        flexWrap='wrap'
        alignItems='center'
        rowGap={1}
      >
        <Select
          size='small'
          value={font}
          onChange={e => {
            setFont(e.target.value)
            editor?.chain().focus().setFontFamily(e.target.value).run()
          }}
          sx={{
            width: 100,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <MenuItem value='Arial'>Arial</MenuItem>
          <MenuItem value='Times New Roman'>Times New Roman</MenuItem>
          <MenuItem value='Courier New'>Courier New</MenuItem>
        </Select>
        <Select
          size='small'
          value={fontSize}
          onChange={e => {
            setFontSize(e.target.value)
            editor?.chain().focus().setFontSize(e.target.value).run()
          }}
        >
          <MenuItem value='12px'>12px</MenuItem>
          <MenuItem value='14px'>14px</MenuItem>
          <MenuItem value='16px'>16px</MenuItem>
          <MenuItem value='18px'>18px</MenuItem>
          <MenuItem value='20px'>20px</MenuItem>
          <MenuItem value='24px'>24px</MenuItem>
        </Select>
        <Tooltip title='字体颜色'>
          <input
            type='color'
            value={color}
            onChange={e => {
              setColor(e.target.value)
              editor?.chain().focus().setColor(e.target.value).run()
            }}
            style={{
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          />
        </Tooltip>
        <Tooltip title='背景颜色'>
          <input
            type='color'
            value={bgColor}
            onChange={e => {
              setBgColor(e.target.value)
              editor
                ?.chain()
                .focus()
                .toggleHighlight({ color: e.target.value })
                .run()
            }}
            style={{
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          />
        </Tooltip>
        <IconButton onClick={() => editor?.chain().focus().toggleBold().run()}>
          <FormatBoldIcon />
        </IconButton>
        <IconButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <FormatItalicIcon />
        </IconButton>
        <IconButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <FormatUnderlinedIcon />
        </IconButton>
        <IconButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulletedIcon />
        </IconButton>
        <IconButton
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
        >
          <FormatAlignLeftIcon />
        </IconButton>
        <IconButton
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
        >
          <FormatAlignCenterIcon />
        </IconButton>
        <IconButton
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
        >
          <FormatAlignRightIcon />
        </IconButton>
        <Tooltip title='清除格式'>
          <IconButton
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <AutoFixHighIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='编辑 HTML'>
          <IconButton size='small' onClick={() => setShowHtml(!showHtml)}>
            <CodeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='添加附件'>
          <IconButton size='small' component='label'>
            <AttachFileIcon />
            <input
              type='file'
              hidden
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return

                if (file.size > 25 * 1024 * 1024) {
                  alert('文件不能超过 25MB')
                  return
                }

                try {
                  const key = file.name
                  const url = await uploadToR2(file, key)

                  setAttachment({ file, url })

                  const saveRes = await fetch('/api/emails/auto-reply/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attachmentUrl: url })
                  })

                  if (!saveRes.ok) {
                    const saveData = await saveRes.json()
                    alert('附件已上传，但保存数据库失败: ' + saveData.error)
                  }
                } catch (err) {
                  console.error('上传失败:', err)
                  alert('上传出错')
                }
              }}
            />
          </IconButton>
        </Tooltip>
      </Stack>

      {showHtml ? (
        <TextField
          multiline
          minRows={10}
          value={body}
          onChange={e => {
            setBody(e.target.value)
            editor?.commands.setContent(e.target.value)
          }}
          fullWidth
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      {attachment && (
        <Box>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            已上传附件：
          </Typography>
          <Stack direction='row' spacing={1} alignItems='center'>
            <a href={attachment.url} target='_blank' rel='noopener noreferrer'>
              {attachment.file.name}
            </a>
            <IconButton
              size='small'
              color='error'
              onClick={async () => {
                const filename = attachment.url.split('/').pop()

                try {
                  const res = await fetch('/api/files/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename })
                  })

                  if (!res.ok) {
                    const data = await res.json()
                    alert('删除失败：' + (data.error || '未知错误'))
                    return
                  }

                  setAttachment(null)

                  const saveRes = await fetch('/api/emails/auto-reply/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attachmentUrl: null })
                  })

                  if (!saveRes.ok) {
                    const data = await saveRes.json()
                    alert(
                      '附件已删除，但数据库清除失败：' +
                        (data.error || '未知错误')
                    )
                  }
                } catch (err) {
                  console.error('删除失败:', err)
                  alert('网络错误，删除失败')
                }
              }}
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Stack>
        </Box>
      )}

      <Box>
        <Typography variant='subtitle1' gutterBottom>
          自动插入最近图片链接？
        </Typography>

        <RadioGroup
          row
          value={isUsingLatestImage ? 'yes' : 'no'}
          onChange={e => setIsUsingLatestImage(e.target.value === 'yes')}
        >
          <FormControlLabel value='yes' control={<Radio />} label='是' />
          <FormControlLabel value='no' control={<Radio />} label='否' />
        </RadioGroup>
        {isUsingLatestImage && latestImage?.url && (
          <Box mt={2}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              即将插入的图片预览：
            </Typography>
            <Box
              component='img'
              src={`${latestImage.url}?t=${Date.now()}`}
              alt='最近图片预览'
              sx={{
                maxWidth: '100%',
                width: 200,
                height: 'auto',
                mt: 1
              }}
            />
          </Box>
        )}
      </Box>

      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Button variant='contained' onClick={() => setConfirmOpen(true)}>
          手动发送
        </Button>
      </Stack>

      <Box>
        <Typography variant='h6' gutterBottom>
          自动回复时间设置（本地时间）
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box display='flex' flexDirection='column' gap={2} maxWidth={300}>
            <TimePicker
              value={replyTime}
              onChange={setReplyTime}
              ampm={true}
              format='hh:mm A'
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Box>
        </LocalizationProvider>
      </Box>

      <Box>
        <Typography variant='h6' gutterBottom>
          是否激活
        </Typography>

        <RadioGroup
          row
          value={isActive ? 'yes' : 'no'}
          onChange={e => setIsActive(e.target.value === 'yes')}
        >
          <FormControlLabel value='yes' control={<Radio />} label='是' />
          <FormControlLabel value='no' control={<Radio />} label='否' />
        </RadioGroup>
      </Box>

      <Box>
        <Button variant='contained' color='primary' onClick={handleSave}>
          保存设置
        </Button>
      </Box>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>确认发送</DialogTitle>
        <DialogContent>
          <Typography>确定要向以下收件人发送自动回复吗？</Typography>
          <Box mt={2} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {recipient}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            sx={{ minWidth: 120 }}
            onClick={() => setConfirmOpen(false)}
          >
            取消
          </Button>
          <Button
            variant='contained'
            sx={{ minWidth: 120 }}
            onClick={() => {
              setConfirmOpen(false)
              handleSend()
            }}
          >
            确认发送
          </Button>
        </DialogActions>
      </Dialog>

      <LoadingBackdrop isOpen={isLoading} />
    </Box>
  )
}
