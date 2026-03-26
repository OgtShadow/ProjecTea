interface Message {
  id?: number
  from?: string
  text: string
}

interface ChatProps {
  messages: Message[]
}

function Chat({ messages }: ChatProps) {
  return (
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
  )
}

export default Chat