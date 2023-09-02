'use client'
// Components
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/react'
import { FaRegTrashCan } from 'react-icons/fa6'

// Actions
import { handleDelete } from '../actions/actions'
// Types
import { Event } from '../types/types'

interface EventComponentProps {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleDeletePress = (onClose: () => void) => {
    handleDelete(event)
    onClose()
  }

  return (
    <span className="flex justify-between align-center">
      {`${event.title} -${event.userId}`}
      <Button isIconOnly variant="solid" onPress={onOpen}>
        <FaRegTrashCan />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete this event?
              </ModalHeader>
              <ModalBody>
                <p>
                  This action cannot be undone. Are you sure you want to
                  continue?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  onPress={() => handleDeletePress(onClose)}
                >
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
    </span>
  )
}

export default EventComponent
