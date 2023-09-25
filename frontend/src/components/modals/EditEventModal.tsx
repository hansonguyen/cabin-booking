import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader
} from '@nextui-org/react'

import { Event } from '@/src/types/types'
import { updateEvent, validateNewEvent } from '@/src/utils/actions'
import { isEvent } from '@/src/utils/utils'
import { toast } from 'react-toastify'

type EditEventModalProps = {
  event: Event
  isEditOpen: boolean
  onEditOpenChange: () => void
}

function EditEventModal({
  event,
  isEditOpen,
  onEditOpenChange
}: EditEventModalProps) {
  // Default value for start and end date inputs
  const defaultStart = `${event.start.getUTCFullYear()}-${
    event.start.getUTCMonth() + 1 < 10 ? '0' : ''
  }${event.start.getUTCMonth() + 1}-${
    event.start.getUTCDate() < 10 ? '0' : ''
  }${event.start.getUTCDate()}`
  const defaultEnd = `${event.end.getUTCFullYear()}-${
    event.end.getUTCMonth() + 1 < 10 ? '0' : ''
  }${event.end.getUTCMonth() + 1}-${
    event.end.getUTCDate() < 10 ? '0' : ''
  }${event.end.getUTCDate()}`

  /**
   * Handle submit of edit event form
   * @param formData
   * @param onClose
   * @returns
   */
  const handleEditSubmit = async (formData: FormData, onClose: () => void) => {
    const result = await validateNewEvent(formData, event._id)
    if (!isEvent(result)) {
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
    await updateEvent(result)
    toast.success(`Successfully edited ${result.title}.`, {
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
                Edit {event.title}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col justify-center align-center gap-6 mt-4">
                  <div className="flex flex-col">
                    <label htmlFor="title">Title of Trip</label>
                    <Input
                      defaultValue={event.title}
                      required
                      type="text"
                      name="title"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="start">Start</label>
                    <Input
                      defaultValue={defaultStart}
                      required
                      type="date"
                      name="start"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="end">End</label>
                    <Input
                      defaultValue={defaultEnd}
                      required
                      type="date"
                      name="end"
                    />
                  </div>
                  <div className="flex gap-1 ml-1">
                    <input type="checkbox" id="everyone" name="everyone" />
                    <label htmlFor="everyone">Everyone?</label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button type="submit" color="primary">
                  Update Event
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

export default EditEventModal
