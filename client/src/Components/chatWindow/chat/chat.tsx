import './chat.css'

interface Message {
  id?: number
  from?: string
  text: string
}

interface ChatProps {
  messages: Message[]
}

function renderMessageText(text: string) {
  const downloadUrlPattern = /(\/api\/files\/download\/[\w.-]+)/g
  const parts = text.split(downloadUrlPattern)

  return parts.map((part, index) => {
    if (part.match(downloadUrlPattern)) {
      return (
        <a key={`${part}-${index}`} href={part} target='_blank' rel='noreferrer'>
          {part}
        </a>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function Chat({ messages }: ChatProps) {
  return (
    <div className='chat-list'>
      <h2>Messages</h2>
      <ul>
        {messages.map((msg, idx) => (
          <li key={msg.id != null ? msg.id : `${msg.from}-${msg.text}-${idx}`}>
            [{msg.id}] {msg.from}: {renderMessageText(msg.text)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Chat