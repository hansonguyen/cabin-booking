import DeleteModal from '@/src/components/modals/DeleteModal'
import { Comment } from '@/src/types/types'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useDisclosure
} from '@nextui-org/react'
import { FaRegTrashCan } from 'react-icons/fa6'
import { FiEdit, FiSettings } from 'react-icons/fi'

function CommentSettings({ comment }: { comment: Comment }) {
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange
  } = useDisclosure()

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="bordered" className="border-none">
            <FiSettings size="0.7rem" className="mb-[1rem]" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="Event settings">
          <DropdownItem
            key="copy"
            startContent={<FiEdit />}
            onPress={() => console.log('edit pressed')}
          >
            Edit
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
      <DeleteModal
        item={comment}
        isDeleteOpen={isDeleteOpen}
        onDeleteOpenChange={onDeleteOpenChange}
      />
    </>
  )
}

export default CommentSettings
