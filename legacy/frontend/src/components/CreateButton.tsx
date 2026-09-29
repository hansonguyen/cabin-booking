import { Button } from '@nextui-org/react'
import { experimental_useFormStatus as useFormStatus } from 'react-dom'

function CreateButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button isDisabled={pending} type="submit" color="primary" className="mt-4">
      {label}
    </Button>
  )
}

export default CreateButton
