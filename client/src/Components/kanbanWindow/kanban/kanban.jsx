import React, { useEffect, useRef, useState, useCallback } from 'react'
import './kanban.css'

const COLUMNS = [
  { key: 'todo', title: 'Do zrobienia' },
  { key: 'inprogress', title: 'W trakcie' },
  { key: 'done', title: 'Zrobione' },
  { key: 'trash', title: 'Kosz' },
]

function Kanban() {
  const [board, setBoard] = useState({ columns: { todo: [], inprogress: [], done: [], trash: [] } })
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColumn, setNewColumn] = useState('todo')
  
  const refs = {
    todo: useRef(null),
    inprogress: useRef(null),
    done: useRef(null),
    trash: useRef(null),
  }
  const draggedRef = useRef(null)

  // Wyodrębniona funkcja pobierania tablicy, aby można ją było łatwo wywoływać po zmianach
  const fetchBoard = useCallback(() => {
    fetch('/api/kanban')
      .then((r) => r.json())
      .then((data) => {
        const cols = (data && data.columns) ? data.columns : {}
        setBoard({ columns: { todo: cols.todo || [], inprogress: cols.inprogress || [], done: cols.done || [], trash: cols.trash || [] } })
      })
      .catch((e) => console.error('kanban fetch error', e))
  }, [])

  useEffect(() => {
    fetchBoard();

    // Podpięcie pod Server-Sent Events (SSE) z backendu Go dla Live Updates
    const evtSource = new EventSource('/api/notifications/stream');
    
    evtSource.onmessage = (event) => {
      // Ignorujemy wiadomości keepalive
      if (event.data === "keepalive") return;
      
      try {
        const data = JSON.parse(event.data);
        // Jeśli przyszło zdarzenie z kanbana (rozpoznajemy po evencie albo po prostu przeładowujemy tablicę)
        // Zakładam, że Twoja struktura eventu zawiera typ powiadomienia, ale bezpiecznie jest po prostu odświeżyć dane
        fetchBoard();
      } catch (err) {
        console.warn("Błąd parsowania SSE:", err);
      }
    };

    return () => {
      evtSource.close();
    };
  }, [fetchBoard])

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

    // Jeśli wrzucono do kosza
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

      fetch(`/api/kanban/tasks/${taskId}`, { method: 'DELETE' })
        .then((res) => {
          if (!res.ok) console.warn('backend delete responded', res.status)
        })
        .catch((e) => console.error('kanban delete error', e))

      draggedRef.current = null
      return
    }

    // Przesunięcie do innej kolumny (Optymistyczny update UI)
    setBoard((prev) => {
      const next = { columns: { todo: [...prev.columns.todo], inprogress: [...prev.columns.inprogress], done: [...prev.columns.done], trash: [...prev.columns.trash] } }
      const src = next.columns[from]
      const removeIdx = src.findIndex((t) => String(t.id) === taskId)
      let moved = null
      
      if (removeIdx !== -1) {
        ;[moved] = src.splice(removeIdx, 1)
      } else {
        return prev
      }
      
      next.columns[toColumn].push(moved)
      return next
    })

    fetch('/api/kanban/move', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, fromColumn: from, toColumn, toIndex: -1 })
    }).catch((e) => console.error('kanban move error', e))
    
    draggedRef.current = null
  }

  return (
    <div className="kanban-root">
      <div className="kanban-create">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Tytuł zadania" />
        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Opis (opcjonalnie)" />
        <select value={newColumn} onChange={e => setNewColumn(e.target.value)}>
          {COLUMNS.filter(c => c.key !== 'trash').map(c => <option key={c.key} value={c.key}>{c.title}</option>)}
        </select>
        <button onClick={async () => {
          if (!newTitle.trim()) return
          try {
            const res = await fetch('/api/kanban/tasks', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: newTitle, description: newDesc, column: newColumn })
            })
            if (!res.ok) throw new Error('create failed')
            const task = await res.json()
            
            setBoard(prev => ({
              columns: {
                ...prev.columns,
                [newColumn]: [...(prev.columns[newColumn] || []), task]
              }
            }))
            setNewTitle(''); 
            setNewDesc('')
          } catch (e) { 
            console.error('create task error', e) 
          }
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