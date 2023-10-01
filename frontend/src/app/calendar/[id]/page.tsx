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
  let displayName = event.everyone ? 'Everyone' : event.userName;

  return (
    <div className="p-4">
        <div className="flex gap-4">
          <h1 className="text-5xl font-bold">{event.title}</h1>
          {session?.user?.id === event.userId && (
            <EventSettings event={event} />
          )}
        </div>
        <p className="text-xl font-semibold">Hosted by, {displayName}</p>
        <p className='my-8'>{event.description}</p>
        <NewComment/>
        {comments.length > 0 ? (
          <div className="flex flex-col gap-4 p-4">
            <h1>Comments for this event ({comments.length}):</h1>
            {comments.map((comment, i) => {
              return <CommentCard key={i} comment={comment} />
            })}
          </div>
        ) : (
          <p>No comments yet.</p>
        )}
    </div>
  )
}

export default EventPage
