import { getComments } from '@/src/utils/actions'
import CommentCard from './CommentCard'

async function EventPage({ params: { id } }: { params: { id: string } }) {
  const comments = await getComments(id)
  
  return (
    <div>
      <h1>My event</h1>
      {comments.length > 0 ? (
        comments.map((comment) => {
          return <CommentCard comment={comment} />
        })
      ) : (
        <p>No comments.</p>
      )}
    </div>
  )
}

export default EventPage
