'use client'

import { Box, Typography, Container } from '@mui/material'

export default function Home() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '90vh',
        px: { xs: 2, sm: 5 }
      }}
    >
      <Container maxWidth='sm'>
        <Box
          textAlign='center'
          display='flex'
          flexDirection='column'
          gap={{ xs: 3, sm: 5 }}
          py={{ xs: 4, sm: 6 }}
        >
          <Typography
            variant='h4'
            fontWeight='bold'
            sx={{ fontSize: { xs: '1.875rem', sm: '2.25rem' } }}
          >
            欢迎回来
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            这是您的邮件图片管理系统
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
