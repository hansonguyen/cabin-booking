'use client'

import { Button, Input } from '@nextui-org/react'

function Login() {
  return (
    <form className="sm:max-w-[75%] lg:max-w-[50%] mx-auto flex flex-col gap-4 bg-slate-200 rounded-md">
      <label>Email</label>
      <Input type="email" name="email" />
      <div className='text-center'>
        <Button type="submit" className="w-1/5">
          Login
        </Button>
      </div>
    </form>
  )
}

export default Login
