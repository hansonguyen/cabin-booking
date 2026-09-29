// ES6+ example
import {
  CognitoIdentityProviderClient,
  CognitoIdentityProviderClientConfig,
  ListUsersCommand,
  UserType
} from '@aws-sdk/client-cognito-identity-provider'

import { redis } from './redis'

const config: CognitoIdentityProviderClientConfig = {
  region: 'us-west-2',
  credentials: {
    accessKeyId: process.env.COGNITO_ACCESS_KEY as string,
    secretAccessKey: process.env.COGNITO_SECRET_ACCESS_KEY as string
  }
}
const client = new CognitoIdentityProviderClient(config)

/**
 * Get all users from cognito user pool
 * @returns
 */
export const getAllUsers = async () => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    AttributesToGet: ['name', 'email', 'sub']
  }
  const command = new ListUsersCommand(params)

  const response = await client.send(command)
  if (!response.Users) {
    throw new Error('No users found.')
  }

  return response.Users
}

/**
 * Get a user based on id
 * @param id
 * @returns
 */
export const getSingleUser = async (id: string) => {
  // Check cache for event first
  const cachedUser = await redis.get(`users-${id}`)

  if (cachedUser) {
    return JSON.parse(cachedUser) as UserType
  }

  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    AttributesToGet: ['name', 'email', 'sub'],
    Filter: `sub = \"${id}\"`
  }
  const command = new ListUsersCommand(params)

  const response = await client.send(command)
  if (!response.Users || response.Users.length === 0) {
    throw new Error('No user found.')
  }

  // Set cache
  await redis.set(`users-${id}`, JSON.stringify(response.Users[0]))

  return response.Users[0]
}
