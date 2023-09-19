import { Comment } from '@/src/types/types'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@nextui-org/react'
import { FaRegTrashCan } from 'react-icons/fa6'
import { FiEdit, FiSettings } from 'react-icons/fi'

function CommentSettings({ comment }: { comment: Comment }) {
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
            onPress={() => console.log('delete pressed')}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  )
}

export default CommentSettings
