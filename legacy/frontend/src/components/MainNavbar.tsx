'use client'
import '@/src/styles/homePage.css'

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem
} from '@nextui-org/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import React from 'react'
import { BiHelpCircle, BiLogOut } from 'react-icons/bi'
import { BsFillPersonFill, BsPersonCircle } from 'react-icons/bs'

function MainNavbar() {
  const router = useRouter()
  const { data: session } = useSession()

  // Handle different menu clicks
  const handleHelp = () => {
    console.log('help')
  }

  return (
    <Navbar maxWidth="full" isBordered className="bg-blue-50 p-4 z-50" >
      <NavbarBrand>
        <Link href="/" className=' Link font-bold text-3xl'>
          Home
        </Link>
      </NavbarBrand>

      {session && (
        <NavbarContent justify="center">
          <NavbarItem>
            <Link aria-current="page" className=' Link font-semibold text-3xl' href="/calendar">
              Calendar
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}

      <NavbarContent as="div" justify="end">
        {session ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                showFallback
                as="button"
                className="transition-transform"
                color="default"
                name={session?.user?.name ? session.user.name : ''}
                src= "https://cdn3.iconfinder.com/data/icons/basic-ui-element-s94-3/64/Basic_UI_Icon_Pack_-_Glyph_user-512.png"
                fallback={<BsPersonCircle size="3rem" />}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownSection showDivider>
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{session?.user?.email}</p>
                </DropdownItem>
              </DropdownSection>
              <DropdownSection showDivider>
                <DropdownItem
                  key="settings"
                  startContent={<BsFillPersonFill />}
                  onClick={() => router.push(`/profile/${session.user.id}`)}
                >
                  My Profile
                </DropdownItem>
                {/* <DropdownItem
                  key="help_and_feedback"
                  startContent={<BiHelpCircle />}
                  onClick={handleHelp}
                >
                  Help & Feedback
                </DropdownItem> */}
              </DropdownSection>
              <DropdownItem
                key="logout"
                color="danger"
                className="text-danger"
                startContent={<BiLogOut />}
                onClick={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button onClick={() => router.push('/login')}>Login</Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
  )
}

export default MainNavbar
