import { useEffect, useMemo, useState } from 'react'
import './App.css'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import type { Frame, IMessage } from '@stomp/stompjs'

interface Message {
  id?: number
  from?: string
  text: string
}

const BACKEND_URL = 'http://localhost:8082'

function App() {
  const [wsConnected, setWsConnected] = useState(false)
  const [inputFrom, setInputFrom] = useState('frontend')
  const [inputText, setInputText] = useState('')
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
              setMessages((prev) => [...prev, message])
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

  const sendRestMessage = async () => {
    if (!inputText.trim()) return
    const payload = { from: inputFrom, text: inputText }
    await fetch(`${BACKEND_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setInputText('')
  }

  const sendWsMessage = () => {
    if (!inputText.trim()) return
    const payload = { from: inputFrom, text: inputText }
    stompClient.publish({ destination: '/app/send', body: JSON.stringify(payload) })
    setInputText('')
  }

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>REST + WebSocket Demo</h1>
      <p>Status: {wsConnected ? 'connected' : 'disconnected'}</p>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={inputFrom}
          onChange={(e) => setInputFrom(e.target.value)}
          placeholder="From"
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message"
          style={{ marginRight: 8, width: 300 }}
        />
        <button onClick={sendRestMessage} style={{ marginRight: 8 }}>
          Send via REST
        </button>
        <button onClick={sendWsMessage}>Send via WS</button>
      </div>

      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg, idx) => (
            <li key={msg.id != null ? msg.id : `${msg.from}-${msg.text}-${idx}`}>
              [{msg.id}] {msg.from}: {msg.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
