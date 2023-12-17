'use client'

import { Button, Textarea } from '@nextui-org/react'
import { useParams } from 'next/navigation'
import { useRef } from 'react'
import { toast } from 'react-toastify'

import CreateButton from '@/src/components/CreateButton'
import { createComment, validateNewComment } from '@/src/utils/actions'
import { isComment } from '@/src/utils/utils'

function NewComment() {
  const params = useParams()
  const ref = useRef<HTMLFormElement>(null)

  /**
   * Logic for adding a new comment
   * @param formData 
   * @returns 
   */
  const handleAddComment = async (formData: FormData) => {
    const id = params.id
    if (Array.isArray(id)) return

    const result = await validateNewComment(formData, id)
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

    ref.current?.reset()
    await createComment(result)
    toast.success('Successfully added comment.', {
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
    <form ref={ref} action={formData => handleAddComment(formData)}>
      <Textarea
        label="Leave a comment"
        labelPlacement="outside"
        placeholder="Enter your comment"
        name='message'
        className="max-w-xs"
      />
      <CreateButton label='Post Comment'/>
    </form>
  )
}

export default NewComment
