import { getUserEvents } from '@/src/utils/actions'
import ProfileCard from './ProfileCard'

async function Profile() {
  const userEvents = await getUserEvents()
  return <ProfileCard userEvents={userEvents}/>
}

export default Profile
