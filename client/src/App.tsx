import { useEffect, useState } from 'react'
import React from 'react'
import Navigation from './Components/navigation/navigation'
import ChatWindow from './Components/chatWindow/chatWindow'
import FilesWindow from './Components/filesWindow/filesWindow.tsx'
import KanbanWindow from './Components/kanbanWindow/kanbanWindow'
import Notifications from './Components/notifications/notifications'
import GraphWindow from './Components/GraphWindow/GraphWindow'
import './App.css'
import apiFetch from './api'

type ActiveView = 'chat' | 'files' | 'kanban' | 'graph'

export const MessageUpdateContext = React.createContext<{ messageCount: number } | null>(null)

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>('chat')
  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState(0)

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
    <MessageUpdateContext.Provider value={{ messageCount: messageUpdateTrigger }}>
      <div className="App">
        <Navigation
          currentUser={currentUser} setCurrentUser={setCurrentUser}
          activeView={activeView} setActiveView={setActiveView}
        />
        <Notifications />
        <div className="content">
          {activeView === 'chat' ? (
            <ChatWindow
              currentUser={currentUser}
              isCheckingSession={isCheckingSession}
              onMessageSent={() => setMessageUpdateTrigger(prev => prev + 1)}
            />
          ) : activeView === 'files' ? (
            <FilesWindow />
          ) : activeView === 'graph' ? (
            <GraphWindow currentUser={currentUser} messageUpdateTrigger={messageUpdateTrigger} />
          ) : (
            <KanbanWindow />
          )}
        </div>
      </div>
    </MessageUpdateContext.Provider>
  )
}

export default App
