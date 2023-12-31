'use client'

import { Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

function Login() {
  const { status } = useSession()
  const router = useRouter()

  if (status === 'authenticated') {
    router.push('calendar')
  }

  return (
    <div className="text-center">
      <Button onClick={() => signIn('cognito')}>Login with Cognito</Button>
    </div>
  )
}

export default Login
