'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Member } from '../lib/bookings'

export function Modal({
  open,
  onClose,
  labelledBy,
  children
}: {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal() focuses the close button; move focus to the field the content asks for, if any.
      dialog.querySelector<HTMLElement>('[data-autofocus="true"]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="modal">
          <button className="icon-button modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={1.8} />
          </button>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function Avatar({ member, size = 32 }: { member: Member; size?: number }) {
  return (
    <span
      className={`avatar m-${member.color}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {member.initials}
    </span>
  )
}

export function Confirm({
  question,
  yes,
  no,
  busy,
  onYes,
  onNo
}: {
  question: string
  yes: string
  no: string
  busy?: boolean
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="confirm" role="group" aria-label={question}>
      <p>{question}</p>
      <div>
        <button className="button quiet" disabled={busy} onClick={onNo}>
          {no}
        </button>
        <button className="button danger" disabled={busy} onClick={onYes}>
          {busy ? 'Working…' : yes}
        </button>
      </div>
    </div>
  )
}

const listLine = /^(\d+[.)]|[-*•])\s+/

/** Renders plain page text: blank lines split paragraphs; runs of "1." or "-" lines become lists. */
export function BodyText({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').filter((line) => line.trim()))
    .filter((lines) => lines.length)
  return (
    <div className="body-text">
      {blocks.map((lines, i) => {
        if (lines.every((line) => listLine.test(line.trim()))) {
          const items = lines.map((line, j) => <li key={j}>{line.trim().replace(listLine, '')}</li>)
          return /^\d/.test(lines[0].trim()) ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
        }
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
