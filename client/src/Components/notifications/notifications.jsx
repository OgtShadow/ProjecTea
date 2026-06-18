import React, { useEffect, useState } from 'react'
import './notifications.css'

function formatNotification(notification) {
  const directType = notification?.type || notification?.Type || 'notification'
  const directPayload = notification?.payload || notification?.Payload || {}

  const wrappedType = directType === 'notifications' ? directPayload?.type : directType
  const wrappedPayload = directType === 'notifications' ? directPayload?.payload || {} : directPayload

  const type = wrappedType || 'notification'
  const payload = wrappedPayload || {}

  if (type === 'kanban.move') {
    const taskTitle = payload?.task?.title || 'zadanie'
    const from = payload?.from || 'unknown'
    const to = payload?.to || 'unknown'
    return {
      title: 'Kanban: przeniesiono zadanie',
      subtitle: `${taskTitle} z ${from} do ${to}`,
      type,
    }
  }

  if (type === 'kanban.create') {
    const taskTitle = payload?.task?.title || 'zadanie'
    const column = payload?.column || 'todo'
    return {
      title: 'Kanban: utworzono zadanie',
      subtitle: `${taskTitle} w kolumnie ${column}`,
      type,
    }
  }

  if (type === 'chat.message') {
    const from = notification?.from || payload?.from || 'unknown'
    const text = notification?.text || payload?.text || ''
    return {
      title: 'Chat: nowa wiadomość',
      subtitle: `${from}: ${text}`,
      type,
    }
  }

  return {
    title: type,
    subtitle: typeof payload === 'string' ? payload : JSON.stringify(payload),
    type,
  }
}

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
      <div className="notifications-list">
        {messages.map((m, i) => (
          <div key={i} className="notification-item">
            {(() => {
              const view = formatNotification(m)
              return (
                <>
                  <div className="notification-topic">{view.title}</div>
                  <div className="notification-payload">{view.subtitle}</div>
                </>
              )
            })()}
          </div>
        ))}
        {messages.length === 0 ? <div className="notification-empty">Brak powiadomień</div> : null}
      </div>
      {/*obecnie zakomentowane bo mi się nie podoba ale może coś jeszcze z tym wykminię 
      <div className="notifications-header">
        Powiadomienia <span className="badge">{messages.length}</span>
        <span className={`notifications-status notifications-status-${status}`}>{status}</span>
      </div> */}
      
    </div>
  )
}
