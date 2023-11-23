'use client'

import { Comment } from '@/src/types/types'
import {
  Avatar,
  Card,
  CardBody,
  CardFooter,
  CardHeader
} from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import CommentSettings from './CommentSettings'

function CommentCard({ comment }: { comment: Comment }) {
  const { data: session } = useSession()
  const { userName, message, createdAt, updatedAt } = comment

  return (
    <Card className="max-w-[340px]">
      <CardHeader className="justify-between">
        <div className="flex gap-5">
          <Link href={`/profile/${comment.userId}`}>
            <Avatar
              isBordered
              radius="full"
              size="md"
              src="https://cdn3.iconfinder.com/data/icons/basic-ui-element-s94-3/64/Basic_UI_Icon_Pack_-_Glyph_user-512.png"
            />
          </Link>
          <div className="flex flex-col gap-1 items-start justify-center">
            <Link href={`/profile/${comment.userId}`} className="text-small font-semibold leading-none text-default-600">
              {userName}
            </Link>
          </div>
        </div>
        {session && session.user.id === comment.userId && (
          <CommentSettings comment={comment} />
        )}
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-400">
        <p>{message}</p>
      </CardBody>
      <CardFooter className="gap-3">
        <div className="flex gap-1">
          <p className=" text-default-400 text-small">
            {createdAt?.getTime() === updatedAt?.getTime()
              ? 'Created At'
              : 'Last Updated'}
          </p>
          <p className="font-semibold text-default-400 text-small">
            {updatedAt?.toLocaleString()}
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}

export default CommentCard
