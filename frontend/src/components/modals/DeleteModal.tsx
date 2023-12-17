'use client'

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

import { Comment, Event } from '@/src/types/types'
import { deleteComment, deleteEvent } from '@/src/utils/actions'
import { isEvent } from '@/src/utils/utils'

type DeleteModalProps = {
  item: Event | Comment
  isDeleteOpen: boolean
  onDeleteOpenChange: () => void
}

function DeleteModal({
  item,
  isDeleteOpen,
  onDeleteOpenChange
}: DeleteModalProps) {
  const router = useRouter()

  const handleDeletePress = async (onClose: () => void) => {
    if (isEvent(item)) {
      await deleteEvent(item)
      router.push('/calendar')
    } else {
      await deleteComment(item)
    }
    onClose()
    toast(`${isEvent(item) ? item.title : 'Comment'} was deleted.`, {
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
              Delete this {isEvent(item) ? 'event' : 'comment'}?
            </ModalHeader>
            <ModalBody>
              <p>
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" onPress={() => handleDeletePress(onClose)}>
                Delete
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

export default DeleteModal
