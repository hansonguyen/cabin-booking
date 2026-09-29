'use client'

import { type FormEvent, useState } from 'react'
import { ArrowRight, Plus, Search } from 'lucide-react'
import type { Member } from '../lib/bookings'
import { type Article, basicsTopic, exportKnowledge, starterPages, topicLabels, topics } from '../lib/cabin-care'
import { sharedBackend } from '../lib/shared-api'
import { BodyText, Confirm, Modal } from './ui'
import type { CabinState } from './use-cabin-state'

type Selection = { kind: 'page'; id: string } | { kind: 'topic'; topic: string } | null
const howToTopics = [...topics.filter((t) => t !== basicsTopic && t !== 'General'), 'General']
const starterOrder = (title: string) => {
  const i = starterPages.findIndex((p) => p.toLowerCase() === title.toLowerCase())
  return i === -1 ? starterPages.length : i
}
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function BookView({
  state,
  memberOf,
  initialPage
}: {
  state: CabinState
  memberOf: (id: string) => Member
  initialPage?: string
}) {
  const { care, careEditable, careReady } = state
  const basics = care.articles
    .filter((a) => a.topic === basicsTopic)
    .sort((a, b) => starterOrder(a.title) - starterOrder(b.title) || a.title.localeCompare(b.title))
  const [selection, setSelection] = useState<Selection>(initialPage ? { kind: 'page', id: initialPage } : null)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Article | null>(null)
  const needle = query.toLowerCase().trim()
  const results = needle
    ? care.articles.filter((a) =>
        `${a.title} ${a.problem} ${a.solution} ${a.tags}`.toLowerCase().includes(needle)
      )
    : []
  const current: Selection = selection ?? (basics[0] ? { kind: 'page', id: basics[0].id } : null)
  const page = current?.kind === 'page' ? care.articles.find((a) => a.id === current.id) : undefined
  const missingStarters = starterPages.filter((p) => !basics.some((a) => a.title.toLowerCase() === p.toLowerCase()))
  const authorName = (a: Article) => (a.author.includes('@') ? memberOf(a.author).name : a.author)

  function draft(title = '', topic: string = basicsTopic): Article {
    return {
      id: crypto.randomUUID(),
      title,
      topic,
      problem: '',
      solution: '',
      tags: '',
      author: memberOf(state.userId).name,
      updatedAt: new Date().toISOString(),
      verified: false
    }
  }
  function open(next: Selection) {
    setQuery('')
    setSelection(next)
  }
  function download() {
    try {
      const bytes = exportKnowledge(care.articles)
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `lake-mary-cabin-book-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      state.setNotice('Downloaded. Unzip it and give KNOWLEDGE.md to your AI assistant — review it first.')
    } catch {
      state.setNotice('The download didn’t work. Please try again.')
    }
  }

  return (
    <div className="page book-page">
      <aside className="book-nav">
        <div>
          <h1>Cabin book</h1>
          <p className="lede small">Everything you’d otherwise text someone to ask.</p>
        </div>
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search the cabin book"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <nav aria-label="House basics">
          <h2 className="nav-heading">House basics</h2>
          {basics.map((a) => (
            <button
              key={a.id}
              className="book-link"
              aria-current={!needle && page?.id === a.id ? 'page' : undefined}
              onClick={() => open({ kind: 'page', id: a.id })}
            >
              {a.title}
            </button>
          ))}
          {!basics.length && <p className="muted small nav-note">Nothing written yet.</p>}
        </nav>
        <nav aria-label="How-tos and fixes">
          <h2 className="nav-heading">How-tos &amp; fixes</h2>
          {howToTopics.map((t) => {
            const count = care.articles.filter((a) => a.topic === t).length
            return (
              <button
                key={t}
                className="book-link"
                aria-current={
                  !needle && (current?.kind === 'topic' ? current.topic === t : page?.topic === t) ? 'page' : undefined
                }
                onClick={() => open({ kind: 'topic', topic: t })}
              >
                <span>{topicLabels[t]}</span>
                <span className="muted">{count || ''}</span>
              </button>
            )
          })}
        </nav>
        <div className="book-tools">
          <button className="button quiet" disabled={!careEditable} onClick={() => setEditing(draft('', current?.kind === 'topic' ? current.topic : basicsTopic))}>
            <Plus size={16} /> Write a page
          </button>
          <button className="button text small" disabled={!care.articles.length} onClick={download}>
            Download everything (for an AI assistant)
          </button>
        </div>
      </aside>

      <div className="book-main">
        {!careReady ? (
          <p className="empty-line">Opening the cabin book…</p>
        ) : needle ? (
          <>
            <p className="kicker">Search</p>
            <h2 className="page-title">
              {results.length ? `${results.length} page${results.length === 1 ? '' : 's'} mention “${query.trim()}”` : `Nothing mentions “${query.trim()}”`}
            </h2>
            <PageList pages={results} onOpen={(id) => open({ kind: 'page', id })} />
          </>
        ) : page ? (
          <article>
            <p className="kicker">{topicLabels[page.topic]}</p>
            <h2 className="page-title">{page.title}</h2>
            <div className="page-meta">
              <span>
                Updated by {authorName(page)}, {shortDate(page.updatedAt)}
              </span>
              <span className={`tag ${page.verified ? 'tag-green' : 'tag-plain'}`}>
                {page.verified ? 'Checked on a real visit' : 'Not checked yet'}
              </span>
              <button className="button quiet small" disabled={!careEditable} onClick={() => setEditing(page)}>
                Edit
              </button>
            </div>
            {page.problem && <p className="page-intro">{page.problem}</p>}
            <BodyText text={page.solution} />
            {page.tags && <p className="fine-print">Keywords: {page.tags}</p>}
          </article>
        ) : current?.kind === 'topic' ? (
          <>
            <p className="kicker">How-tos &amp; fixes</p>
            <h2 className="page-title">{topicLabels[current.topic]}</h2>
            <PageList
              pages={care.articles.filter((a) => a.topic === current.topic)}
              onOpen={(id) => open({ kind: 'page', id })}
            />
            {!care.articles.some((a) => a.topic === current.topic) && (
              <p className="empty-line">
                Nothing here yet. Figured something out? Write it down once and nobody has to figure it out again.
              </p>
            )}
          </>
        ) : (
          <div className="book-empty">
            <h2 className="page-title">Start the cabin book</h2>
            <p className="page-intro">
              A few short pages cover most of what people ask. Pick one to start — rough notes are fine, others can fill
              in the rest.
            </p>
          </div>
        )}
        {careReady && !needle && missingStarters.length > 0 && current?.kind !== 'topic' && (
          <div className="starters">
            <p className="muted small">Still missing from House basics:</p>
            <div>
              {missingStarters.map((title) => (
                <button key={title} className="button quiet small" disabled={!careEditable} onClick={() => setEditing(draft(title))}>
                  <Plus size={14} /> {title}
                </button>
              ))}
            </div>
          </div>
        )}
        {!sharedBackend && page?.id.startsWith('example-') && (
          <p className="fine-print">This is an example page. Edit it with the family’s real details.</p>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} labelledBy="page-editor-title">
        {editing && (
          <PageEditor
            key={editing.id}
            article={editing}
            editor={memberOf(state.userId).name}
            state={state}
            onDone={(id) => {
              setEditing(null)
              if (id) open({ kind: 'page', id })
              else setSelection(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function PageList({ pages, onOpen }: { pages: Article[]; onOpen: (id: string) => void }) {
  if (!pages.length) return null
  return (
    <ul className="page-list">
      {pages.map((a) => (
        <li key={a.id}>
          <button onClick={() => onOpen(a.id)}>
            <span>
              <span className="row-title">{a.title}</span>
              <span className="row-meta">
                {topicLabels[a.topic]} · {(a.problem || a.solution).split('\n')[0]}
              </span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function PageEditor({
  article,
  editor,
  state,
  onDone
}: {
  article: Article
  editor: string
  state: CabinState
  onDone: (openId?: string) => void
}) {
  const exists = state.care.articles.some((a) => a.id === article.id)
  const [draft, setDraft] = useState(article)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const set = (change: Partial<Article>) => setDraft((current) => ({ ...current, ...change }))

  async function save(articles: Article[], openId?: string) {
    setSaving(true)
    const failure = await state.saveCare({ ...state.care, articles })
    setSaving(false)
    if (failure) return setError(failure)
    onDone(openId)
  }
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft.title.trim() || !draft.solution.trim()) return setError('A page needs a title and something written in it.')
    const next = {
      ...draft,
      title: draft.title.trim(),
      solution: draft.solution.trim(),
      author: editor,
      updatedAt: new Date().toISOString()
    }
    save([...state.care.articles.filter((a) => a.id !== article.id), next], next.id)
  }

  return (
    <>
      <h2 id="page-editor-title">{exists ? 'Edit page' : 'Write a page'}</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label className="field">
            Title
            <input
              data-autofocus={!article.title}
              maxLength={100}
              placeholder="What would someone look for?"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </label>
          <label className="field">
            Section
            <select value={draft.topic} onChange={(e) => set({ topic: e.target.value })}>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {topicLabels[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>
            When you’d need this <span className="optional">(optional)</span>
          </span>
          <textarea
            rows={2}
            maxLength={8000}
            placeholder="What happened, or when this comes up"
            value={draft.problem}
            onChange={(e) => set({ problem: e.target.value })}
          />
        </label>
        <label className="field">
          The page
          <textarea
            data-autofocus={!!article.title}
            rows={9}
            maxLength={12000}
            placeholder={'Write it how you’d explain it.\nStart lines with 1. or - to make a list.'}
            value={draft.solution}
            onChange={(e) => set({ solution: e.target.value })}
          />
        </label>
        <label className="field">
          <span>
            Other words people might search for <span className="optional">(optional)</span>
          </span>
          <input
            maxLength={300}
            placeholder="door, spare key, winter"
            value={draft.tags}
            onChange={(e) => set({ tags: e.target.value })}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={draft.verified} onChange={(e) => set({ verified: e.target.checked })} />
          <span>
            I’ve checked this on a real visit
            <small>Otherwise it shows as “Not checked yet.”</small>
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {confirming ? (
          <Confirm
            question="Delete this page from the cabin book?"
            yes="Yes, delete page"
            no="Keep it"
            busy={saving}
            onYes={() => save(state.care.articles.filter((a) => a.id !== article.id))}
            onNo={() => setConfirming(false)}
          />
        ) : (
          <div className="modal-actions">
            {exists && state.canDeleteItem(article.createdBy) && (
              <button type="button" className="button text danger-text" disabled={!state.careEditable} onClick={() => setConfirming(true)}>
                Delete page
              </button>
            )}
            <button className="button primary" disabled={saving || !state.careEditable}>
              {saving ? 'Saving…' : 'Save page'}
            </button>
          </div>
        )}
      </form>
    </>
  )
}
