import { useRef, useState } from 'react'
import './messageSender.css'

interface MessageSenderProps {
  wsConnected: boolean
  onSendWs: (text: string) => void
  onSendFile?: (file: File) => void
}

function MessageSender({ wsConnected, onSendWs, onSendFile }: MessageSenderProps) {
  const [inputText, setInputText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sendWsMessage = () => {
    if (!inputText.trim() || !wsConnected) return
    onSendWs(inputText)
    setInputText('')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        const downloadUrl = data?.file?.downloadUrl ?? '/api/files'
        onSendWs(
          `📎 Wysłany plik: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) pobierz: ${downloadUrl}`,
        )
        onSendFile?.(file)
      } else {
        alert('Błąd podczas wysyłania pliku')
      }
    } catch (error) {
      console.error('Błąd uploadu pliku:', error)
      alert('Błąd podczas wysyłania pliku')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className='send_button'
        disabled={!wsConnected || isUploading}
        title='Wyślij plik'
      >
        {isUploading ? '⏳' : '📎'}
      </button>
      <button
        onClick={sendWsMessage}
        className='send_button'
        disabled={!wsConnected}
      >
        Send
      </button>
    </div>
  )
}

export default MessageSender
