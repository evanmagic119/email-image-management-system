'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Pagination,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import LoadingBackdrop from '@/components/LoadingBackdrop'

interface ImageItem {
  key: string
  url: string
}

export default function ImageManager() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const pageSize = 12

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    fetchImages(1)
  }, [])

  const fetchImages = async (pageNum: number) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/files/list?page=${pageNum}&pageSize=${pageSize}`
      )
      const data = await res.json()
      setImages(data.images)
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err) {
      console.error('获取图片失败', err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      console.error('复制失败')
    }
  }

  function getCreatedTimeFromKey(key: string): string {
    const match = key.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)
    if (!match) return ''

    const [, year, month, day, hour, minute, second] = match
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)

    const localFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'longOffset'
    })

    return localFormatter.format(date)
  }

  const generateDefaultImage = async () => {
    setIsLoading(true)
    setUploadingKey('default')
    try {
      const res = await fetch('/api/files/fetch-default-image')
      if (!res.ok) {
        console.error('无法从 R2 获取默认图片')
        return
      }

      const blob = await res.blob()
      if (blob.size === 0) {
        console.error('获取的图片是空的，请检查 R2')
        return
      }
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

      const filename = `${timestamp}.png`
      const file = new File([blob], filename, { type: 'image/png' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', filename)

      const uploadRes = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await uploadRes.json()

      if (!uploadRes.ok) {
        console.error('上传失败:', data.error || '未知错误')
        return
      }

      setTimeout(() => {
        fetchImages(1)
        localStorage.setItem('latestImageUpdated', Date.now().toString())
      }, 500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert('生成失败：' + message)
    } finally {
      setUploadingKey(null)
      setIsLoading(false)
    }
  }

  const handleReplaceImage = async (file: File, key: string) => {
    if (!/^\d{14}\.png$/.test(key)) {
      alert('非法文件名，无法替换')
      return
    }

    setUploadingKey(key)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', key)

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        console.error('上传失败:', data.error)
        alert('替换失败：' + (data.error || '上传接口返回失败'))
        return
      }

      setTimeout(() => {
        fetchImages(page)
        localStorage.setItem('latestImageUpdated', Date.now().toString())
      }, 500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert('替换失败：' + message)
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <Box px={{ xs: 2, sm: 4 }} py={3}>
      <Box textAlign='center' mb={3}>
        <Button
          variant='contained'
          color='success'
          onClick={generateDefaultImage}
          disabled={uploadingKey === 'default'}
        >
          {uploadingKey === 'default' ? '生成中...' : '生成新链接'}
        </Button>
      </Box>

      <Stack spacing={2}>
        {images.map(img => (
          <Box
            key={img.key}
            display='flex'
            flexDirection={{ xs: 'column', sm: 'row' }}
            alignItems='center'
            gap={2}
            p={2}
            borderRadius={2}
            boxShadow={1}
            bgcolor='#fff'
          >
            <Typography
              minWidth={isMobile ? 'auto' : 160}
              variant='body2'
              color='textSecondary'
            >
              创建时间：{getCreatedTimeFromKey(img.key)}
            </Typography>

            <Box
              component='img'
              src={`${img.url}?t=${Date.now()}`}
              alt={img.key}
              sx={{
                width: 128,
                height: 128,
                borderRadius: 1,
                objectFit: 'cover',
                border: '1px solid #ddd'
              }}
            />

            <TextField
              value={img.url}
              size='small'
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ flex: 1 }}
              variant='outlined'
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems='center'
            >
              <Button
                size='small'
                variant='outlined'
                onClick={() => fileInputRefs.current[img.key]?.click()}
                disabled={uploadingKey === img.key}
              >
                {uploadingKey === img.key ? '替换中...' : '替换图片'}
              </Button>

              <Button
                size='small'
                variant='contained'
                color={copiedKey === img.key ? 'success' : 'primary'}
                onClick={() => copyToClipboard(img.url, img.key)}
              >
                {copiedKey === img.key ? '✔ 已复制' : '复制链接'}
              </Button>
            </Stack>

            <input
              type='file'
              accept='image/png'
              style={{ display: 'none' }}
              ref={el => {
                fileInputRefs.current[img.key] = el
              }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleReplaceImage(file, img.key)
              }}
            />
          </Box>
        ))}
      </Stack>

      {(hasMore || page > 1) && (
        <Box mt={4} display='flex' justifyContent='center'>
          <Pagination
            count={hasMore ? page + 1 : page}
            page={page}
            onChange={(_, newPage) => fetchImages(newPage)}
            color='primary'
            shape='rounded'
            siblingCount={1}
            boundaryCount={1}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      <LoadingBackdrop isOpen={isLoading} />
    </Box>
  )
}
