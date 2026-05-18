import { useState } from 'react'
import apiFetch from '../../api'
import './login.css'

interface Props {
  currentUser: string | null
  setCurrentUser: (u: string | null) => void
}

function Login({ currentUser, setCurrentUser }: Props) {
  const [usernameInput, setUsernameInput] = useState('')
  const [authError, setAuthError] = useState('')

  const login = async () => {
    const trimmed = usernameInput.trim()
    if (trimmed.length < 2) {
      setAuthError('Username must have at least 2 characters.')
      return
    }

    setAuthError('')
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: trimmed }),
    })

    if (!response.ok) {
      setAuthError('Login failed.')
      return
    }

    const payload = await response.json()
    setCurrentUser(payload.username)
    setUsernameInput('')
  }

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
  }

  if (currentUser) {
    return (
      <div className="nav-login">
        <div>Hi, {currentUser}</div>
        <button className="nav-button-logout" onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <div className="nav-login">
      <input
        className="session-input"
        value={usernameInput}
        onChange={(e) => setUsernameInput(e.target.value)}
        placeholder="Username"
      />
      <button className="nav-button" onClick={() => login().catch(console.error)}>Login</button>
      {authError && <div className="session-error">{authError}</div>}
    </div>
  )
}

export default Login