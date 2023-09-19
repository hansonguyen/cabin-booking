import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'
import { toast } from 'react-toastify'

import { handleDelete } from '@/src/utils/actions'
import { Event } from '@/src/types/types'

type EditEventModalProps = {
  event: Event
  isDeleteOpen: boolean
  onDeleteOpenChange: () => void
}

function DeleteEventModal({
  event,
  isDeleteOpen,
  onDeleteOpenChange
}: EditEventModalProps) {

  const handleDeletePress = async (onClose: () => void) => {
    await handleDelete(event)
    onClose()
    toast(`${event.title} was deleted.`, {
      position: 'top-center',
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'colored'
    })
  }

  return (
    <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Delete this event?
            </ModalHeader>
            <ModalBody>
              <p>
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" onPress={() => handleDeletePress(onClose)}>
                Delete this event
              </Button>
              <Button color="default" variant="light" onPress={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default DeleteEventModal
