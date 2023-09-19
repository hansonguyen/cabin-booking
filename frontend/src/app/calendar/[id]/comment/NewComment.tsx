'use client'

import { Button, Textarea } from '@nextui-org/react'

function NewComment() {
  return (
    <form>
      <Textarea
        label="Comment"
        labelPlacement="outside"
        placeholder="Enter your comment"
        className="max-w-xs"
      />
      <Button>Add Comment</Button>
    </form>
  )
}

export default NewComment
