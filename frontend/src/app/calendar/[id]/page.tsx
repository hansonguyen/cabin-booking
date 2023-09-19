import { getComments } from '@/src/utils/actions'
import CommentCard from './comment/CommentCard'
import NewComment from './comment/NewComment'

async function EventPage({ params: { id } }: { params: { id: string } }) {
  const comments = await getComments(id)

  return (
    <>
      <NewComment />
      <h1>Comments for this event</h1>
      {comments.length > 0 ? (
        <div className="flex flex-col gap-4 p-4">
          {comments.map((comment) => {
            return <CommentCard comment={comment} />
          })}
        </div>
      ) : (
        <p>No comments.</p>
      )}
    </>
  )
}

export default EventPage
