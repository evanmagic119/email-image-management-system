'use client'

import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import MailIcon from '@mui/icons-material/Mail'
import ImageIcon from '@mui/icons-material/Image'
import LogoutIcon from '@mui/icons-material/Logout'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import React, { useState } from 'react'

type NavItem = {
  label: string
  path: string
  icon: React.ReactNode
}

export default function SideBar() {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { status } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const mainNav: NavItem[] = [
    { label: '邮件管理', path: '/emails', icon: <MailIcon fontSize='small' /> },
    {
      label: '图片管理',
      path: '/pictures',
      icon: <ImageIcon fontSize='small' />
    }
  ]

  const renderNavItems = () => (
    <Box>
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        mb={2}
        mt={1}
      >
        <Box
          component='img'
          src='/logo.png'
          alt='Logo'
          sx={{
            width: 80,
            height: 80,
            borderRadius: '20%',
            objectFit: 'cover',
            boxShadow: 1
          }}
        />
      </Box>

      <List>
        {mainNav.map(item => {
          const isSelected = pathname === item.path

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  router.push(item.path)
                  setDrawerOpen(false)
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? 'primary.main' : 'inherit'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          )
        })}
        {status === 'authenticated' && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                signOut()
                setDrawerOpen(false)
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText primary='退出登录' />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  )

  return (
    <>
      {/* 顶部汉堡菜单按钮（仅在移动端显示） */}
      {isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16
          }}
        >
          <IconButton onClick={() => setDrawerOpen(true)} size='large'>
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* 抽屉组件（移动端） */}
      <Drawer
        anchor='left'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 200, mt: 2 }}>{renderNavItems()}</Box>
      </Drawer>

      {/* 固定侧边栏（桌面端） */}
      {!isMobile && (
        <Box
          sx={{
            width: 200,
            height: '100vh',
            borderRight: '1px solid #ddd',
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: '#fff',
            p: 2,
            zIndex: theme => theme.zIndex.drawer
          }}
        >
          {renderNavItems()}
        </Box>
      )}
    </>
  )
}
