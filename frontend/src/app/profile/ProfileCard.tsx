'use client'
import { Event } from '@/src/types/types'
import { UserType } from '@aws-sdk/client-cognito-identity-provider'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function ProfileCard({
  user,
  userEvents
}: {
  user: UserType
  userEvents: Event[]
}) {
  // Initialize profile data
  const { data: session } = useSession()
  let userId: string | undefined, name: string | undefined, email: string | undefined
  if (user && user.Attributes && user.Attributes.length >= 3) {
    userId = user.Attributes[0].Value
    name = user.Attributes[1].Value
    email = user.Attributes[2].Value
  } else {
    // Handle the case where user or user.Attributes is undefined or doesn't have enough items
    throw new Error('No user values found.')
  }
  if (!userId || !name || !email) {
    throw new Error('No user values found.')
  }

  return (
    <Card className="py-4 w-[80%] mx-auto mt-[5rem] h-[30rem] lg:w-[50%]">
      <CardHeader className="py-2 px-4 flex-col items-start">
        <h1 className="font-bold text-3xl">{name}</h1>
        <small className="text-default-500">{email}</small>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        {userEvents.length > 0 ? (
          <div className="flex flex-col">
            <h6 className="font-semibold">
              {session?.user.id === userId ? 'My' : name + "'s"} Events
            </h6>
            {userEvents.map((event) => {
              return <Link href={`/calendar/${event._id}`}>{event.title}</Link>
            })}
          </div>
        ) : (
          <p>No events.</p>
        )}
      </CardBody>
    </Card>
  )
}
