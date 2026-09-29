import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@nextui-org/react'
import { FaRegTrashCan } from 'react-icons/fa6'
import { FiEdit, FiSettings } from 'react-icons/fi'

import DeleteModal from '@/src/components/modals/DeleteModal'
import EditCommentModal from '@/src/components/modals/EditCommentModal'
import useCommentSettings from '@/src/hooks/useCommentSettings'
import { Comment } from '@/src/types/types'

function CommentSettings({ comment }: { comment: Comment }) {
  const {
    isEditOpen,
    onEditOpen,
    onEditOpenChange,
    isDeleteOpen,
    onDeleteOpen,
    onDeleteOpenChange
  } = useCommentSettings()

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
            onPress={onEditOpen}
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
      <EditCommentModal
        comment={comment}
        isEditOpen={isEditOpen}
        onEditOpenChange={onEditOpenChange}
      />
      <DeleteModal
        item={comment}
        isDeleteOpen={isDeleteOpen}
        onDeleteOpenChange={onDeleteOpenChange}
      />
    </>
  )
}

export default CommentSettings
