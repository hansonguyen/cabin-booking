import { getUserEvents } from '@/src/utils/actions'
import { getSingleUser } from '@/src/utils/users'
import ProfileCard from '../ProfileCard'

async function Profile({ params: { id } }: { params: { id: string } }) {
  const userEvents = await getUserEvents(id)
  const user = await getSingleUser(id)
  return <ProfileCard user={user} userEvents={userEvents} />
}

export default Profile
