import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@nextui-org/react'
import { FaRegEnvelope, FaRegTrashCan } from 'react-icons/fa6'
import { FiEdit, FiSettings } from 'react-icons/fi'

import DeleteEventModal from '@/src/components/modals/DeleteEventModal'
import EditEventModal from '@/src/components/modals/EditEventModal'
import InviteEventModal from '@/src/components/modals/InviteEventModal'
import useEventSettings from '@/src/hooks/useEventSettings'
import { Event } from '@/src/types/types'

function EventSettings({ event }: { event: Event }) {
  const {
    isEditOpen,
    onEditOpen,
    onEditOpenChange,
    isInviteOpen,
    onInviteOpen,
    onInviteOpenChange,
    isDeleteOpen,
    onDeleteOpen,
    onDeleteOpenChange
  } = useEventSettings()

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="bordered"
            className="border-none text-white"
          >
            <FiSettings size="0.7rem" className="mb-[1rem]" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="Event settings">
          <DropdownItem
            key="copy"
            startContent={<FiEdit />}
            onPress={onEditOpen}
          >
            Edit
          </DropdownItem>

          <DropdownItem
            key="copy"
            startContent={<FaRegEnvelope />}
            onPress={onInviteOpen}
          >
            Invite
          </DropdownItem>
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            startContent={<FaRegTrashCan />}
            onPress={onDeleteOpen}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <EditEventModal
        event={event}
        isEditOpen={isEditOpen}
        onEditOpenChange={onEditOpenChange}
      />
      <InviteEventModal
        isInviteOpen={isInviteOpen}
        onInviteOpenChange={onInviteOpenChange}
      />
      <DeleteEventModal
        event={event}
        isDeleteOpen={isDeleteOpen}
        onDeleteOpenChange={onDeleteOpenChange}
      />
    </>
  )
}

export default EventSettings
