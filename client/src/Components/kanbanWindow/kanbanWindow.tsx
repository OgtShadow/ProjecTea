import './kanbanWindow.css'
import Kanban from './kanban/kanban.jsx'
import ErrorBoundary from './ErrorBoundary'

function KanbanWindow() {
  return (
    <div className="kanban-window">
      <h2>Kanban</h2>
      <ErrorBoundary>
        <Kanban/>
      </ErrorBoundary>
    </div>
  )
}

export default KanbanWindow
