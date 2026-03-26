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

const BACKEND_URL = 'http://localhost:8082'

function ChatWindow() {
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
    stompClient.activate()

    fetch(`${BACKEND_URL}/api/messages`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(console.error)

    return () => {
      stompClient.deactivate()
    }
  }, [stompClient])

  const sendWsMessage = (from: string, text: string) => {
    if (!text.trim()) return

    stompClient.publish({
      destination: '/app/send',
      body: JSON.stringify({ from, text }),
    })
  }

  return (
    <div className="chat-window">
      <h2>Chat Window</h2>
      <Chat messages={messages} />
      <MessageSender
        wsConnected={wsConnected}
        onSendWs={sendWsMessage}
      />
    </div>
  )
}

export default ChatWindow