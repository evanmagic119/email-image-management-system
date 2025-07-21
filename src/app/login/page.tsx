// app/login/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Box, Paper, Typography, TextField, Button } from '@mui/material'
import LoadingBackdrop from '@/components/LoadingBackdrop'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setIsLoading(true)
    const res = await signIn('credentials', {
      redirect: false,
      password,
      callbackUrl: '/'
    })
    setIsLoading(false)
    if (res?.ok) {
      router.push(res.url!)
    } else {
      setError('登录失败，密码错误')
    }
  }

  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      minHeight='90vh'
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: { xs: '100%', sm: 360 },
          maxWidth: 400,
          borderRadius: 2
        }}
      >
        <Typography variant='h6' align='center'>
          邮件图片管理系统
        </Typography>
        <TextField
          label='密码'
          type='password'
          fullWidth
          margin='normal'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && (
          <Typography color='error' fontSize={14}>
            {error}
          </Typography>
        )}
        <Button
          variant='contained'
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
        >
          登录
        </Button>
      </Paper>
      <LoadingBackdrop isOpen={isLoading} />
    </Box>
  )
}
