import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'

import { Comment } from '@/src/types/types'
import { updateComment, validateNewComment } from '@/src/utils/actions'
import { isComment } from '@/src/utils/utils'
import { useParams } from 'next/navigation'
import { toast } from 'react-toastify'

type EditCommentModal = {
  comment: Comment
  isEditOpen: boolean
  onEditOpenChange: () => void
}

function EditCommentModal({
  comment,
  isEditOpen,
  onEditOpenChange
}: EditCommentModal) {
  const params = useParams()

  /**
   * Handle submit of edit event form
   * @param formData
   * @param onClose
   * @returns
   */
  const handleEditSubmit = async (formData: FormData, onClose: () => void) => {
    const id = params.id
    if (Array.isArray(id)) return

    const result = await validateNewComment(
      formData,
      id,
      comment._id,
      comment.createdAt
    )
    if (!isComment(result)) {
      const toastId = 'validate-error'
      toast.error(result.error, {
        toastId,
        position: 'top-center',
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored'
      })
      return
    }
    await updateComment(result)
    toast.success('Successfully edited comment.', {
      position: 'top-center',
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'colored'
    })
    onClose()
  }

  return (
    <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <form
              action={(formData) => handleEditSubmit(formData, onClose)}
              className="text-center mt-4"
            >
              <ModalHeader className="flex flex-col gap-1">
                Edit Comment
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col">
                  <label htmlFor="title">Message</label>
                  <Input
                    defaultValue={comment.message}
                    required
                    type="text"
                    name="message"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button type="submit" color="primary">
                  Update Comment
                </Button>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default EditCommentModal
