import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'
import { FiSearch } from 'react-icons/fi'
import { getAllUsers } from '@/src/utils/users'
//  import { useEffect, useState } from 'react'

type EditEventModalProps = {
  isInviteOpen: boolean
  onInviteOpenChange: () => void
}

function InviteEventModal({
  isInviteOpen,
  onInviteOpenChange
}: EditEventModalProps) 


{
  // const user = await getAllUsers()


  return (
    <Modal isOpen={isInviteOpen} onOpenChange={onInviteOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Invite</ModalHeader>
            <ModalBody>
              <Input
                required
                type="text"
                placeholder="Search"
                startContent={<FiSearch />}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                Invite
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

export default InviteEventModal
