// app/layout.tsx
import type { Metadata } from 'next'
import { Providers } from '@/app/providers'
import LayoutContent from '@/components/LayoutContent' // ✅ 引入你刚创建的组件

export const metadata: Metadata = {
  title: '邮件图片管理系统',
  description: '邮件图片管理系统'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='zh'>
      <body>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  )
}
