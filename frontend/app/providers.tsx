'use client'

import { NextUIProvider } from '@nextui-org/react'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <NextUIProvider>{children}</NextUIProvider>
    </SessionProvider>
  )
}
