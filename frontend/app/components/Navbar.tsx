'use client'
import {
  Avatar,
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
import React from 'react'
import { BiHelpCircle, BiLogOut } from 'react-icons/bi'
import { BsFillPersonFill, BsPersonCircle } from 'react-icons/bs'

// temp variable to test signed in or not
const isSignedIn = false

function MainNavbar() {
  const router = useRouter()

  // Handle different menu clicks
  const handleHelp = () => {
    console.log('help')
  }

  const handleLogout = () => {
    console.log('logout')
  }

  return (
    <Navbar maxWidth="full" isBordered className="bg-slate-100 p-4">
      <NavbarBrand>
        <Link href="/calendar" className="font-bold text-3xl">
          SMITH CABIN
        </Link>
      </NavbarBrand>

      <NavbarContent as="div" justify="end">
        {isSignedIn ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                showFallback
                as="button"
                className="transition-transform"
                color="secondary"
                name="Jason Hughes"
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                fallback={<BsPersonCircle size="3rem" />}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownSection showDivider>
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">zoey@example.com</p>
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
                onClick={handleLogout}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Link href="/login" color="primary">
              Login
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
  )
}

export default MainNavbar
