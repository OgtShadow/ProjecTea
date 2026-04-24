import { useEffect, useMemo, useState } from 'react'
import './chatWindow.css'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import type { Frame, IMessage } from '@stomp/stompjs'
import MessageSender from '../messageSender/messageSender'
import Chat from '../chat/chat'

interface Message {
  id?: number
  from?: string
  text: string
}

interface AuthUserResponse {
  username: string
}

const BACKEND_URL = ''

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
}

function ChatWindow() {
  const [wsConnected, setWsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [usernameInput, setUsernameInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  const stompClient = useMemo(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      reconnectDelay: 3000,
      debug: (str: string) => {
        console.debug('[STOMP]', str)
      },
      onConnect: (frame: Frame) => {
        console.log('WS connected', frame)
        setWsConnected(true)

        client.subscribe('/topic/messages', (msg: IMessage) => {
          if (msg.body) {
            try {
              const message = JSON.parse(msg.body) as Message
              setMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) return prev
                return [...prev, message]
              })
            } catch (error) {
              console.error('Invalid WS payload', msg.body, error)
            }
          }
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
      },
      onDisconnect: () => {
        console.log('WS disconnected')
        setWsConnected(false)
      },
    })

    return client
  }, [currentUser])

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('No active session')
        }

        const me = (await response.json()) as AuthUserResponse
        setCurrentUser(me.username)
      })
      .catch(() => {
        setCurrentUser(null)
      })
      .finally(() => {
        setIsCheckingSession(false)
      })
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setWsConnected(false)
      if (stompClient.active) {
        stompClient.deactivate()
      }
      return
    }

    stompClient.activate()

    apiFetch('/api/messages')
      .then((r) => {
        if (!r.ok) {
          throw new Error('Could not load messages')
        }
        return r.json()
      })
      .then(setMessages)
      .catch(console.error)

    return () => {
      stompClient.deactivate()
    }
  }, [currentUser, stompClient])

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

    const payload = (await response.json()) as AuthUserResponse
    setCurrentUser(payload.username)
    setUsernameInput('')
  }

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setCurrentUser(null)
    setWsConnected(false)
    setMessages([])
  }

  const sendWsMessage = (text: string) => {
    if (!text.trim()) return

    stompClient.publish({
      destination: '/app/send',
      body: JSON.stringify({ text }),
    })
  }

  if (isCheckingSession) {
    return <div className='chat-window'>Checking session...</div>
  }

  return (
    <div className="chat-window">
      <div className='session-bar'>
        {currentUser ? (
          <>
            <div className='session-state'>User: {currentUser}</div>
            <button onClick={logout} className='session-button'>Logout</button>
          </>
        ) : (
          <>
            <input
              type='text'
              className='session-input'
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder='Username'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  login().catch(console.error)
                }
              }}
            />
            <button
              onClick={() => {
                login().catch(console.error)
              }}
              className='session-button'
            >
              Login
            </button>
          </>
        )}
      </div>

      {authError && <div className='session-error'>{authError}</div>}

      <h2>Chat Window Status: {wsConnected ? 'connected' : 'disconnected'}</h2>
      <div className="chat-messages">
        <Chat messages={messages} />
      </div>
      <div className="chat-sender">
        <MessageSender
          wsConnected={wsConnected}
          onSendWs={sendWsMessage}
        />
      </div>
    </div>
  )
}

export default ChatWindow