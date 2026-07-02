import './kanbanWindow.css'
// @ts-ignore
import Kanban from './kanban/kanban.jsx'
// @ts-ignore
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
