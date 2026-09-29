import '@/src/styles/globals.css'

import { faComment } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect,useState } from 'react'

import { Event } from '@/src/types/types'
import { getComments} from '@/src/utils/actions'

type EventComponentProps = {
  event: Event
}


type Comment = {
  message: string
  userName: string
  userId: string
  bookingId: string
  _id?: string
  createdAt?: Date
  updatedAt?: Date
}



function EventComponent({event}: EventComponentProps) {

  let backgroundColor = event.everyone ? '#880808' : '#5F8575'
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (event._id) {
      getComments(event._id).then(comments => setComments(comments));
    }
  }, [event._id]);

  let displayName = event.userName
  if(event.customName){
    displayName = event.customName;
  }
  if (event.everyone){
    displayName =  'Everyone!'
  }


  return (
    <div className="relative" style={{ backgroundColor}}>
      <span className="flex justify-between h-6">
      {` ${event.title} - ${displayName}`} {comments.length > 0 && <FontAwesomeIcon style = {{paddingTop: '5px', paddingRight: '3px'}}icon={faComment} />}
      </span>
    </div>
  )
}

export default EventComponent
