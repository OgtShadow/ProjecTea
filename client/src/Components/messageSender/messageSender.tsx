import { useState } from 'react'
import './messageSender.css'

interface MessageSenderProps {
  wsConnected: boolean
  onSendWs: (text: string) => void
}

function MessageSender({ wsConnected, onSendWs }: MessageSenderProps) {
  const [inputText, setInputText] = useState('')

  const sendWsMessage = () => {
    if (!inputText.trim() || !wsConnected) return
    onSendWs(inputText)
    setInputText('')
  }

  return (
    <div className='messageSender'>
      <input
        type='text'
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder='Message'
        className='message_input'
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendWsMessage()
          }
        }}
      />
      <button onClick={sendWsMessage} className='send_button' disabled={!wsConnected}>
        Send
      </button>
    </div>
  )
}

export default MessageSender
