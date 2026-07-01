import React, { useEffect, useRef, useState } from 'react'
import './kanban.css'

const COLUMNS = [
  { key: 'todo', title: 'Do zrobienia' },
  { key: 'inprogress', title: 'W trakcie' },
  { key: 'done', title: 'Zrobione' },
  { key: 'trash', title: 'Kosz' },
]

function Kanban() {
  const [board, setBoard] = useState({ columns: { todo: [], inprogress: [], done: [], trash: [] } })
  const [users, setUsers] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColumn, setNewColumn] = useState('todo')
  const [newDueDate, setNewDueDate] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const refs = {
    todo: useRef(null),
    inprogress: useRef(null),
    done: useRef(null),
    trash: useRef(null),
  }
  const draggedRef = useRef(null)

  useEffect(() => {
    // fetch initial board and ensure 'trash' column exists
    fetch('/api/kanban')
      .then((r) => r.json())
      .then((data) => {
        const cols = (data && data.columns) ? data.columns : {}
        setBoard({ columns: { todo: cols.todo || [], inprogress: cols.inprogress || [], done: cols.done || [], trash: cols.trash || [] } })
      })
      .catch((e) => console.error('kanban fetch error', e))
  }, [])

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) {
          throw new Error('users fetch failed')
        }
        return r.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          setUsers([])
          return
        }

        const mapped = data
          .map((u) => {
            if (typeof u === 'string') {
              return { username: u, displayName: u }
            }

            if (u && typeof u === 'object' && u.username) {
              return {
                username: u.username,
                displayName: u.displayName || u.username,
              }
            }

            return null
          })
          .filter(Boolean)

        setUsers(mapped)
      })
      .catch((e) => {
        console.error('users fetch error', e)
        setUsers([])
      })
  }, [])

  // HTML5 drag-and-drop handlers (replaces Sortable to avoid DOM/React conflicts)
  const onDragStart = (e, task, fromColumn, index) => {
    try {
      draggedRef.current = { taskId: String(task.id), fromColumn, index }
      e.dataTransfer.setData('text/plain', String(task.id))
      e.dataTransfer.effectAllowed = 'move'
    } catch (err) {
      console.error('dragstart error', err)
    }
  }

  const onDragOverColumn = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDropToColumn = (e, toColumn) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('text/plain')
    const dragged = draggedRef.current || { taskId: data }
    const taskId = String(dragged.taskId)
    const from = dragged.fromColumn
    if (!taskId) return
    // if dropped into trash -> delete
    if (toColumn === 'trash') {
      setBoard((prev) => {
        const next = { columns: { todo: [...prev.columns.todo], inprogress: [...prev.columns.inprogress], done: [...prev.columns.done], trash: [...prev.columns.trash] } }
        const src = next.columns[from]
        const removeIdx = src.findIndex((t) => String(t.id) === taskId)
        if (removeIdx !== -1) {
          src.splice(removeIdx, 1)
        }
        return next
      })

      // attempt to delete on backend
      fetch(`/api/kanban/tasks/${taskId}`, { method: 'DELETE' })
        .then((res) => {
          if (!res.ok) console.warn('backend delete responded', res.status)
        })
        .catch((e) => console.error('kanban delete error', e))

      draggedRef.current = null
      return
    }

    // update state: remove from source and append to target
    setBoard((prev) => {
      const next = { columns: { todo: [...prev.columns.todo], inprogress: [...prev.columns.inprogress], done: [...prev.columns.done], trash: [...prev.columns.trash] } }
      const src = next.columns[from]
      const removeIdx = src.findIndex((t) => String(t.id) === taskId)
      let moved = null
      if (removeIdx !== -1) {
        ;[moved] = src.splice(removeIdx, 1)
      } else {
        // if not found, nothing to move
        return prev
      }
      next.columns[toColumn].push(moved)
      return next
    })

    // notify backend (append to end)
    fetch('/api/kanban/move', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, fromColumn: from, toColumn, toIndex: -1 })
    }).catch((e) => console.error('kanban move error', e))
    draggedRef.current = null
  }

  return (
    <div className="kanban-root">
      <div className="kanban-create">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tytuł zadania" />
        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Opis (opcjonalnie)" />
        <input
          type="date"
          value={newDueDate}
          onChange={e => setNewDueDate(e.target.value)}
          aria-label="Termin zadania"
        />
        <select
          value={newAssignee}
          onChange={e => setNewAssignee(e.target.value)}
          aria-label="Przypisz użytkownika"
        >
          <option value="">Nieprzypisane</option>
          {users.map((u) => (
            <option key={u.username} value={u.username}>{u.displayName}</option>
          ))}
        </select>
        <select value={newColumn} onChange={e => setNewColumn(e.target.value)}>
          {COLUMNS.filter(c => c.key !== 'trash').map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
        </select>
            <button onClick={async () => {
          if (!newTitle.trim()) return
          try {
            const res = await fetch('/api/kanban/tasks', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: newTitle,
                description: newDesc,
                column: newColumn,
                dueDate: newDueDate,
                assignee: newAssignee,
              })
            })
            if (!res.ok) throw new Error('create failed')
            const task = await res.json()
                setBoard(prev => ({
                  columns: {
                    ...prev.columns,
                    [newColumn]: [...(prev.columns[newColumn] || []), task]
                  }
                }))
            setNewTitle(''); setNewDesc(''); setNewDueDate(''); setNewAssignee('')
          } catch (e) { console.error('create task error', e) }
        }}>Dodaj</button>
      </div>
      <div className="kanban-columns">
        {COLUMNS.map((col) => (
          <div className={`kanban-column ${col.key === 'trash' ? 'trash' : ''}`} key={col.key}>
            <div className="kanban-column-header">{col.title}</div>
            <div className="kanban-column-list" data-column={col.key} ref={refs[col.key]} onDragOver={onDragOverColumn} onDrop={(e) => onDropToColumn(e, col.key)}>
              {(board.columns[col.key] || []).map((task, idx) => (
                <div key={task.id} className="kanban-card" data-id={task.id} draggable onDragStart={(e) => onDragStart(e, task, col.key, idx)}>
                  <div className="kanban-card-title">{task.title}</div>
                  {task.description ? <div className="kanban-card-desc">{task.description}</div> : null}
                  {task.dueDate ? <div className="kanban-card-meta">Termin: {task.dueDate}</div> : null}
                  {task.assignee ? <div className="kanban-card-meta">Przypisane: {task.assignee}</div> : null}
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
