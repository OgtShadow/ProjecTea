import React, { useEffect, useState } from 'react'
import './notifications.css'

export default function Notifications() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('connecting')
  const [retryToken, setRetryToken] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const es = new EventSource('/api/notifications/stream')

    setStatus('connecting')
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setStatus('connected')
        setRetryCount(0)
        setMessages(prev => [data].concat(prev).slice(0, 20))
      } catch (err) {
        console.error('invalid notification', err)
      }
    }
    es.onerror = (err) => {
      console.warn('SSE error', err)
      setStatus('disconnected')
      es.close()
      setRetryCount((current) => {
        if (current >= 5) {
          return current
        }
        window.setTimeout(() => {
          setRetryToken((token) => token + 1)
        }, Math.min(3000 * (current + 1), 15000))
        return current + 1
      })
    }
    return () => {
      es.close()
    }
  }, [retryToken])

  return (
    <div className="notifications-root">
      <div className="notifications-header">
        Powiadomienia <span className="badge">{messages.length}</span>
        <span className={`notifications-status notifications-status-${status}`}>{status}</span>
      </div>
      <div className="notifications-list">
        {messages.map((m, i) => (
          <div key={i} className="notification-item">
            <div className="notification-topic">{m.topic || m.Topic || 'notif'}</div>
            <div className="notification-payload">{typeof m.payload === 'string' ? m.payload : JSON.stringify(m.payload)}</div>
          </div>
        ))}
        {messages.length === 0 ? <div className="notification-empty">Brak powiadomień</div> : null}
      </div>
    </div>
  )
}
