'use client'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import { FaPlus,FaMinus, FaRegTrashCan } from 'react-icons/fa6'
import { toast } from 'react-toastify'
import '@/src/styles/globals.css';

import { handleDelete } from '@/src/actions/actions'
import { Event } from '@/src/types/types'
import { withRouter } from 'next/router'

type EventComponentProps = {
  event: Event
}

function EventComponent({ event }: EventComponentProps) {
  const { data: session } = useSession()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

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
    <div className= "relative">
      <span className="flex justify-between h-6">
        {`${event.title} -${event.userName}`}
        {session?.user?.id === event.userId && (
          <div className="flex">
          <Button
            isIconOnly
            variant="bordered"
            onPress={onOpen}
            className="border-none"
            color="white"
          >
            <FaPlus size="0.7rem" className="mb-[1rem]" />
          </Button>
          <Button
            isIconOnly
            variant="bordered"
            onPress={onOpen}
            className="border-none"
            color="white"
          >
            <FaMinus size="0.7rem" className="mb-[1rem]" />
          </Button>
          <Button
            isIconOnly
            variant="bordered"
            onPress={onOpen}
            className="border-none"
            color="white"
          >
            <FaRegTrashCan size="0.75rem" className="mb-[1rem]" />
          </Button>
        </div>
        )}
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
    </div>
  )
}

export default EventComponent
