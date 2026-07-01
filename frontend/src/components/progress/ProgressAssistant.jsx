import { MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  buildSuggestedQuestions,
  generateAssistantAnswer,
} from '../../utils/progressAssistant.js'

function ProgressAssistant({ contextType, data }) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const suggestions = useMemo(() => buildSuggestedQuestions(contextType), [contextType])

  function askAssistant(question) {
    const cleanedQuestion = question.trim()
    if (!cleanedQuestion) return

    const answer = generateAssistantAnswer({
      contextType,
      data,
      question: cleanedQuestion,
    })

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `user-${Date.now()}`, role: 'user', text: cleanedQuestion },
      { id: `assistant-${Date.now()}`, role: 'assistant', text: answer },
    ])
    setInput('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    askAssistant(input)
  }

  return (
    <div className="progress-assistant">
      {isOpen && (
        <section className="progress-assistant__panel" aria-label="Progress Assistant">
          <header className="progress-assistant__header">
            <span className="progress-assistant__avatar">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>Progress Assistant</h2>
              <p>Ask about progress, submissions, reviews, or attention items.</p>
            </div>
            <button
              className="progress-assistant__close"
              type="button"
              aria-label="Close Progress Assistant"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="progress-assistant__messages" aria-live="polite">
            <div className="progress-assistant__message progress-assistant__message--assistant">
              <p>Hi, I can summarize what needs attention on this progress screen.</p>
            </div>
            {messages.map((message) => (
              <div
                className={`progress-assistant__message progress-assistant__message--${message.role}`}
                key={message.id}
              >
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <div className="progress-assistant__chips" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => askAssistant(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="progress-assistant__form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              placeholder="Ask a short question..."
              aria-label="Ask Progress Assistant"
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" aria-label="Send question">
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        className="progress-assistant__toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label="Open Progress Assistant"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <MessageCircle size={21} aria-hidden="true" />
        <span>Assistant</span>
      </button>
    </div>
  )
}

export default ProgressAssistant
