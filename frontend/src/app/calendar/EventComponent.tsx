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
import { handleDelete } from '../../actions/actions'
// Types
import { Event } from '../../types/types'

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
    <>
      <span className="flex justify-between h-6">
        {`${event.title} -${event.userId}`}
        <Button
          isIconOnly
          variant="bordered"
          onPress={onOpen}
          className="border-none"
        >
          <FaRegTrashCan size="0.75rem" className='mb-[1rem]'/>
        </Button>
      </span>
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
    </>
  )
}

export default EventComponent
