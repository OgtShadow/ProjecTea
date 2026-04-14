import { useState } from 'react'
import './messageSender.css'

interface MessageSenderProps {
  wsConnected: boolean
  onSendWs: (from: string, text: string) => void
}

function MessageSender({ onSendWs }: MessageSenderProps) {
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
        className='name_input'
      />
      <input
        type='text'
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder='Message'
        className='message_input'
      />
      <button onClick={sendWsMessage} className='send_button'>Send</button>
    </div>
  )
}

export default MessageSender
