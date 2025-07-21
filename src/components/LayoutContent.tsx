'use client'

import { usePathname } from 'next/navigation'
import { Box } from '@mui/material'
import SideBar from '@/components/SideBar'

export default function LayoutContent({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <Box display='flex' height='100%'>
      <SideBar />
      <Box
        component='main'
        flexGrow={1}
        p={3}
        sx={{ ml: { md: '200px', xs: 0 } }}
      >
        {children}
      </Box>
    </Box>
  )
}
