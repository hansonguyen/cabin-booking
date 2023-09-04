'use client'
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
    <Navbar maxWidth="full" isBordered className="bg-slate-100 p-4">
      <NavbarBrand>
        <Link href="/" className="font-bold text-3xl">
          SMITH CABIN
        </Link>
      </NavbarBrand>

      {session && (
        <NavbarContent justify="center">
          <NavbarItem>
            <Link aria-current="page" className='font-semibold text-xl' href="/calendar">
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
                color="secondary"
                name={session?.user?.name ? session.user.name : ''}
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
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
                  onClick={() => router.push('/profile')}
                >
                  My Profile
                </DropdownItem>
                <DropdownItem
                  key="help_and_feedback"
                  startContent={<BiHelpCircle />}
                  onClick={handleHelp}
                >
                  Help & Feedback
                </DropdownItem>
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
