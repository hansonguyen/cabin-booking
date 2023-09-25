'use client'
import { Event } from '@/src/types/types'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function ProfileCard({ userEvents }: { userEvents: Event[] }) {
  const { data: session } = useSession()

  return (
    <Card className="py-4 w-[80%] mx-auto mt-[5rem] h-[30rem] lg:w-[50%]">
      <CardHeader className="py-2 px-4 flex-col items-start">
        <h1 className="font-bold text-3xl">{session?.user?.name}</h1>
        <small className="text-default-500">{session?.user?.email}</small>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        {userEvents.length > 0 ? (
          <div className='flex flex-col'>
            <h6 className='font-semibold'>My Events</h6>
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
