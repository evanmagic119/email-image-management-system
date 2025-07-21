'use client'

import { useRef, useState } from 'react'
import { Box, Button, Container, Typography } from '@mui/material'
import LoadingBackdrop from '@/components/LoadingBackdrop'

export default function UploadDefaultImage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaultImageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE}/default-image.png`
  const [previewUrl, setPreviewUrl] = useState(
    `${defaultImageUrl}?t=${Date.now()}`
  )

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setMessage(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const uploadImage = async () => {
    if (!selectedFile) return

    if (selectedFile.size > 25 * 1024 * 1024) {
      alert('文件不能超过 25MB')
      return
    }

    setIsLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('filename', 'default-image.png')

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '上传失败')
        return
      }

      setMessage('✅ 默认图片上传成功！')
      setPreviewUrl(`${defaultImageUrl}?t=${Date.now()}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setMessage(`❌ 上传失败：${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth='sm'>
      <Typography variant='h5' fontWeight='bold' mb={3}>
        上传默认图片
      </Typography>

      {/* 拖拽/点击选择区域 */}
      <Box
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragging ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragging ? 'blue.50' : 'transparent',
          transition: 'all 0.2s'
        }}
      >
        <Typography color='textSecondary'>
          点击或拖拽图片到此区域以选择
        </Typography>
        <input
          type='file'
          accept='image/*'
          ref={fileInputRef}
          onChange={handleFileChange}
          hidden
        />
      </Box>

      {/* 图片预览 */}
      <Box
        component='img'
        key={previewUrl}
        src={previewUrl}
        alt='默认图片预览'
        sx={{ width: '100%', py: 3, objectFit: 'contain' }}
      />

      {/* 上传按钮 */}
      <Box mt={3} textAlign='center'>
        <Button
          variant='contained'
          color='primary'
          onClick={uploadImage}
          disabled={isLoading}
        >
          Upload
        </Button>
      </Box>

      {/* 状态提示 */}
      {message && (
        <Typography mt={3} textAlign='center' color='textSecondary'>
          {message}
        </Typography>
      )}
      <LoadingBackdrop isOpen={isLoading} />
    </Container>
  )
}
