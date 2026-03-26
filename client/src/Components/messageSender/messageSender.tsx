import { useState } from 'react'

interface MessageSenderProps {
  wsConnected: boolean
  onSendWs: (from: string, text: string) => void
}

function MessageSender({ wsConnected, onSendWs }: MessageSenderProps) {
  const [inputFrom, setInputFrom] = useState('frontend')
  const [inputText, setInputText] = useState('')

  const sendWsMessage = () => {
    if (!inputText.trim()) return
    onSendWs(inputFrom, inputText)
    setInputText('')
  }

  return (
    <div className='messageSender'>
        <input
          type='text'
          value={inputFrom}
          onChange={(e) => setInputFrom(e.target.value)}
          placeholder='From'
          style={{ marginRight: 8 }}
        />
        <input
          type='text'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='Message'
          style={{ marginRight: 8, width: 300 }}
        />
        <button onClick={sendWsMessage}>Send via WS</button>
    </div>
  )
}

export default MessageSender
