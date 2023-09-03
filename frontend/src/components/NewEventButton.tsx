import { Button } from '@nextui-org/react'
import { experimental_useFormStatus as useFormStatus } from 'react-dom'

function NewEventButton() {
  const { pending } = useFormStatus()

  return (
    <Button isDisabled={pending} type="submit" color="primary">
      Create Event
    </Button>
  )
}

export default NewEventButton
