import { useEffect, useMemo, useState } from 'react'
import './chatWindow.css'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import type { Frame, IMessage } from '@stomp/stompjs'
import MessageSender from './messageSender/messageSender'
import Chat from './chat/chat'
import apiFetch from '../../api'

interface Message {
  id?: number
  from?: string
  text: string
}

const BACKEND_URL = ''

interface Props {
  currentUser: string | null
  isCheckingSession: boolean
  onMessageSent?: () => void
}

function ChatWindow({ currentUser, isCheckingSession, onMessageSent }: Props) {
  const [wsConnected, setWsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

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
  }, [])

  useEffect(() => {
    if (!currentUser) {
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

  const sendWsMessage = (text: string) => {
    if (!text.trim() || !wsConnected) return

    stompClient.publish({
      destination: '/app/send',
      body: JSON.stringify({ text }),
    })
    onMessageSent?.()
  }

  const handleFileUpload = (file: File) => {
    console.log('Plik wysłany:', file.name)
  }

  if (isCheckingSession) {
    return <div className='chat-window'>Checking session...</div>
  }

  return (
    <div className="chat-window">
      <div className='session-bar'>
        {currentUser ? (
          <div className='session-state'>User: {currentUser}</div>
        ) : (
          <div className='session-state'>Not logged in. Use login in the left panel.</div>
        )}
      </div>

      <h2>Chat Window Status: {wsConnected ? 'connected' : 'disconnected'}</h2>
      <div className="chat-messages">
        <Chat messages={currentUser ? messages : []} />
      </div>
      <div className="chat-sender">
        <MessageSender
          wsConnected={wsConnected}
          onSendWs={sendWsMessage}
          onSendFile={handleFileUpload}
        />
      </div>
    </div>
  )
}

export default ChatWindow