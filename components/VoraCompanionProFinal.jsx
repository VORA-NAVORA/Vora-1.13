import React, { useState, useEffect, useRef } from 'react'

export default function VoraCompanionProFinal() {
  const [messages, setMessages] = useState([
    { sender: 'vora', text: 'Hello, I’m VORA. Ask me anything about NAVORA.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const messageEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => prev + ' ' + transcript)
      }
      recognition.onerror = () => {
        setIsListening(false)
      }
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
    setIsListening(!isListening)
  }

  const speak = async (text) => {
    if (!voiceEnabled || typeof window === 'undefined') return
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
    } catch (err) {
      console.error('Voice playback error:', err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage = { sender: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const response = await fetch('/api/ask-vora-trained', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage.text })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let result = ''
    const voraMessage = { sender: 'vora', text: '' }
    setMessages(prev => [...prev, voraMessage])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))
      for (const line of lines) {
        const json = line.replace(/^data: /, '')
        if (json === '[DONE]') break
        try {
          const parsed = JSON.parse(json)
          const token = parsed.choices?.[0]?.delta?.content || ''
          result += token
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1].text = result
            return updated
          })
        } catch (err) {
          console.error('Parse error:', err)
        }
      }
    }

    speak(result)
    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage()
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="p-4 text-center font-semibold text-xl border-b border-cyan-800 bg-gradient-to-b from-cyan-900/20 to-transparent">
        <div className="flex flex-col items-center justify-center">
          <div className="w-32 h-32 relative">
            <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-pulse" />
            <div 
              className="relative w-32 h-32 bg-cyan-400 animate-float rounded-full"
            />
          </div>
          <div className="mt-4 text-cyan-400 font-bold text-2xl tracking-wide">
            NAVORA AI
          </div>
          <div className="text-sm text-cyan-300">Advanced Companion System</div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'vora' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-3xl p-4 rounded-2xl ${
              msg.sender === 'vora' 
                ? 'bg-cyan-900/60 backdrop-blur-sm border border-cyan-700/50'
                : 'bg-gray-800/60 backdrop-blur-sm border border-gray-700/50'
            }`}>
              <div className={`text-sm ${msg.sender === 'vora' ? 'text-cyan-300' : 'text-gray-300'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <footer className="p-4 border-t border-cyan-800 bg-gradient-to-t from-cyan-900/20">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleVoiceInput}
            className={`p-3 rounded-lg ${isListening ? 'bg-cyan-600' : 'bg-cyan-800'} hover:bg-cyan-700 transition-colors`}
          >
            {isListening ? '🎤' : '🎙️'}
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about NAVORA systems..."
            className="flex-1 p-3 rounded-xl bg-gray-900/60 backdrop-blur-sm border border-cyan-800/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
          />

          <button 
            onClick={sendMessage}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-medium transition-colors"
          >
            Send
          </button>

          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            className="p-3 rounded-lg bg-cyan-800 hover:bg-cyan-700 transition-colors"
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </footer>
    </div>
  )
}