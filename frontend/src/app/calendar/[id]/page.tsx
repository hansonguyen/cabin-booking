import { getComments, getSingleEvent } from '@/src/utils/actions'
import { authOptions } from '@/src/utils/auth'
import { getServerSession } from 'next-auth'
import EventSettings from '../event/EventSettings'
import CommentCard from './comment/CommentCard'
import NewComment from './comment/NewComment'

async function EventPage({ params: { id } }: { params: { id: string } }) {
  const comments = await getComments(id)
  const event = await getSingleEvent(id)
  const session = await getServerSession(authOptions)

  return (
    <div className="p-4">
      <div className='flex gap-4'>
        <h1 className="text-5xl font-bold">{event.title}</h1>
        {session?.user?.id === event.userId && <EventSettings event={event} />}
      </div>
      <p className="text-xl font-semibold">{event.userName}</p>
      <NewComment />
      <h1>Comments for this event</h1>
      {comments.length > 0 ? (
        <div className="flex flex-col gap-4 p-4">
          {comments.map((comment, i) => {
            return <CommentCard key={i} comment={comment} />
          })}
        </div>
      ) : (
        <p>No comments.</p>
      )}
    </div>
  )
}

export default EventPage
