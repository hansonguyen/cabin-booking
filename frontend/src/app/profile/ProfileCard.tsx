'use client'
import { Card, CardHeader, CardBody, Image } from '@nextui-org/react'
import { useSession } from 'next-auth/react'

export default function App() {
  const { data: session } = useSession()

  return (
    <Card className="py-4 w-[80%] mx-auto mt-[5rem] h-[30rem] lg:w-[50%]">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <h4 className="font-bold text-large">{session?.user?.name}</h4>
        <small className="text-default-500">{session?.user?.email}</small>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Card background"
          className="object-cover rounded-xl"
          src="/images/hero-card-complete.jpeg"
          width={270}
        />
      </CardBody>
    </Card>
  )
}
