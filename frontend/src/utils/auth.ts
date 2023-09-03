import { AuthOptions } from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'

const getCognitoVars = () => {
  const clientId = process.env.COGNITO_CLIENT_ID
  const clientSecret = process.env.COGNITO_CLIENT_SECRET
  const issuer = process.env.COGNITO_ISSUER

  if (!clientId || clientId.length === 0) throw new Error('Invalid client ID')
  if (!clientSecret || clientSecret.length === 0)
    throw new Error('Invalid client secret')
  if (!issuer || issuer.length === 0) throw new Error('Invalid issuer')

  return { clientId, clientSecret, issuer }
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: '/login'
  },
  providers: [
    CognitoProvider({
      clientId: getCognitoVars().clientId,
      clientSecret: getCognitoVars().clientSecret,
      issuer: getCognitoVars().issuer
    })
  ]
}
