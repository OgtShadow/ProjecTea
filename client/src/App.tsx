import { useEffect, useState } from 'react'
import Navigation from './Components/navigation/navigation'
import ChatWindow from './Components/chatWindow/chatWindow'
import FilesWindow from './Components/filesWindow/filesWindow.tsx'
import KanbanWindow from './Components/kanbanWindow/kanbanWindow'
import './App.css'
import apiFetch from './api'

type ActiveView = 'chat' | 'files' | 'kanban'

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>('chat')

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) {
          setCurrentUser(null)
          return
        }

        const me = await response.json()
        setCurrentUser(me.username)
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsCheckingSession(false))
  }, [])

  return (
    <div className="App">
      <Navigation
        currentUser={currentUser} setCurrentUser={setCurrentUser}
        activeView={activeView} setActiveView={setActiveView}
      />
      <div className="content">
        {activeView === 'chat' ? (
          <ChatWindow currentUser={currentUser} isCheckingSession={isCheckingSession} />
        ) : activeView === 'files' ? (
          <FilesWindow />
        ) : (
          <KanbanWindow />
        )}
      </div>
    </div>
  )
}

export default App
