import { useDisclosure } from '@nextui-org/react'

const useCommentSettings = () => {
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange
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
    isDeleteOpen,
    onDeleteOpen,
    onDeleteOpenChange
  }
}

export default useCommentSettings
