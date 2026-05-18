import React, { useEffect, useRef, useState } from 'react'
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/modular/sortable.esm.js'
import './kanban.css'

const COLUMNS = [
  { key: 'todo', title: 'Do zrobienia' },
  { key: 'inprogress', title: 'W trakcie' },
  { key: 'done', title: 'Zrobione' },
]

function Kanban() {
  const [board, setBoard] = useState({ columns: { todo: [], inprogress: [], done: [] } })
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColumn, setNewColumn] = useState('todo')
  const refs = {
    todo: useRef(null),
    inprogress: useRef(null),
    done: useRef(null),
  }

  useEffect(() => {
    // fetch initial board
    fetch('/api/kanban')
      .then((r) => r.json())
      .then((data) => setBoard(data))
      .catch((e) => console.error('kanban fetch error', e))
  }, [])

  useEffect(() => {
    // init Sortable for each column
    const sortables = []
    COLUMNS.forEach((col) => {
      const el = refs[col.key].current
      if (!el) return
      const s = Sortable.create(el, {
        group: 'kanban',
        animation: 150,
        onEnd: (evt) => {
          const itemEl = evt.item
          const taskId = itemEl.dataset.id
          const from = evt.from.dataset.column
          const to = evt.to.dataset.column
          const toIndex = evt.newIndex
          // optimistic update
          setBoard((prev) => {
            const next = { columns: { todo: [...prev.columns.todo], inprogress: [...prev.columns.inprogress], done: [...prev.columns.done] } }
            // remove from source
            const src = next.columns[from]
            const removeIdx = src.findIndex((t) => t.id === taskId)
            if (removeIdx !== -1) {
              const [moved] = src.splice(removeIdx, 1)
              const dst = next.columns[to]
              const idx = Math.min(Math.max(0, toIndex), dst.length)
              dst.splice(idx, 0, moved)
            }
            return next
          })

          // send to backend
          fetch('/api/kanban/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, fromColumn: from, toColumn: to, toIndex }),
          }).catch((e) => console.error('kanban move error', e))
        },
      })
      sortables.push(s)
    })

    return () => {
      sortables.forEach((s) => s.destroy && s.destroy())
    }
  }, [board])

  return (
    <div className="kanban-root">
      <div className="kanban-create">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tytuł zadania" />
        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Opis (opcjonalnie)" />
        <select value={newColumn} onChange={e => setNewColumn(e.target.value)}>
          {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
        </select>
        <button onClick={async () => {
          if (!newTitle.trim()) return
          try {
            const res = await fetch('/api/kanban/tasks', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newTitle, description: newDesc, column: newColumn })
            })
            if (!res.ok) throw new Error('create failed')
            const task = await res.json()
            setBoard(prev => ({
              columns: {
                todo: [...prev.columns.todo],
                inprogress: [...prev.columns.inprogress],
                done: [...prev.columns.done],
                [newColumn]: [...prev.columns[newColumn], task]
              }
            }))
            setNewTitle(''); setNewDesc('')
          } catch (e) { console.error('create task error', e) }
        }}>Dodaj</button>
      </div>
      <div className="kanban-columns">
        {COLUMNS.map((col) => (
          <div className="kanban-column" key={col.key}>
            <div className="kanban-column-header">{col.title}</div>
            <div className="kanban-column-list" data-column={col.key} ref={refs[col.key]}>
              {(board.columns[col.key] || []).map((task) => (
                <div key={task.id} className="kanban-card" data-id={task.id}>
                  <div className="kanban-card-title">{task.title}</div>
                  {task.description ? <div className="kanban-card-desc">{task.description}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Kanban
