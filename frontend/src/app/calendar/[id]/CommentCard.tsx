'use client'

import { Comment } from '@/src/types/types'
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/react'

type CommentCardProps = {
  comment: Comment
}

function CommentCard({ comment }: CommentCardProps) {
  const { userName, message, createdAt, updatedAt } = comment

  return (
    <Card className="max-w-[340px]">
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600">
              {userName}
            </h4>
          </div>
        </div>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-400">
        <p>{message}</p>
      </CardBody>
      <CardFooter className="gap-3">
        <div className="flex gap-1">
          <p className=" text-default-400 text-small">{createdAt.getTime() === updatedAt.getTime() ? 'Created At' : 'Last Updated'}</p>
          <p className="font-semibold text-default-400 text-small">
            {updatedAt.toLocaleString()}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CommentCard
