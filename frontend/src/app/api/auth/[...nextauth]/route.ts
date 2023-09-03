import { authOptions } from '@/src/utils/auth'
import NextAuth from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }