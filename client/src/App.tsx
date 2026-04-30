import { useEffect, useState } from 'react'
import Navigation from './Components/navigation/navigation'
import ChatWindow from './Components/chatWindow/chatWindow'
import './App.css'
import apiFetch from './api'

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

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
      <Navigation currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <ChatWindow currentUser={currentUser} isCheckingSession={isCheckingSession} />
    </div>
  )
}

export default App
