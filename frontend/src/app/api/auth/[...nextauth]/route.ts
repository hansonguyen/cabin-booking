import NextAuth from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'

import { authOptions } from '@/src/utils/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }