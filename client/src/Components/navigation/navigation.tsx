import './navigation.css'
import Login from '../login/login'

type ActiveView = 'chat' | 'files' | 'kanban'

interface Props {
  currentUser: string | null
  setCurrentUser: (u: string | null) => void
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
}

function Navigation({ currentUser, setCurrentUser, activeView, setActiveView }: Props) {
  return (
    <div className="navigation">
      <div>
        <button
          className={`nav-button${activeView === 'chat' ? ' active' : ''}`}
          onClick={() => setActiveView('chat')}
        >
          chat
        </button>
        <button
          className={`nav-button${activeView === 'files' ? ' active' : ''}`}
          onClick={() => setActiveView('files')}
        >
          files
        </button>
        <button
          className={`nav-button${activeView === 'kanban' ? ' active' : ''}`}
          onClick={() => setActiveView('kanban')}
        >
          kanban
        </button>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Login currentUser={currentUser} setCurrentUser={setCurrentUser} />
      </div>
    </div>
  )
}

export default Navigation