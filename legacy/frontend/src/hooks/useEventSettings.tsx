import { useDisclosure } from '@nextui-org/react'

const useEventSettings = () => {
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange
  } = useDisclosure()
  const {
    isOpen: isInviteOpen,
    onOpen: onInviteOpen,
    onOpenChange: onInviteOpenChange
  } = useDisclosure()
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange
  } = useDisclosure()

  return {
    isEditOpen,
    onEditOpen,
    onEditOpenChange,
    isInviteOpen,
    onInviteOpen,
    onInviteOpenChange,
    isDeleteOpen,
    onDeleteOpen,
    onDeleteOpenChange
  }
}

export default useEventSettings
