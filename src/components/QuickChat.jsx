import { useEffect, useMemo, useRef, useState } from 'react'
import { QUICK_MESSAGES } from '../services/chatService'
import { getPlayerAvatar } from '../lib/playerVisuals'
import AppIcon from './AppIcon'

export default function QuickChat({ latestMessage, uid, me, opponent, busy, onSend, onIncoming }) {
  const [open, setOpen] = useState(false)
  const [visibleMessage, setVisibleMessage] = useState(null)
  const lastMessageId = useRef(null)

  useEffect(() => {
    if (!latestMessage?.id || latestMessage.id === lastMessageId.current) return
    lastMessageId.current = latestMessage.id

    const age = Date.now() - Number(latestMessage.sentAt || 0)
    if (age > 12000) return

    setVisibleMessage(latestMessage)
    if (latestMessage.senderUid !== uid) onIncoming?.()

    const timer = window.setTimeout(() => setVisibleMessage(null), 3300)
    return () => window.clearTimeout(timer)
  }, [latestMessage, onIncoming, uid])

  const sender = visibleMessage?.senderUid === uid ? me : opponent
  const suggestions = useMemo(() => QUICK_MESSAGES, [])

  const send = async (text) => {
    const ok = await onSend(text)
    if (ok !== null) setOpen(false)
  }

  return (
    <>
      {visibleMessage && (
        <div className={`chat-bubble-pop ${visibleMessage.senderUid === uid ? 'chat-bubble-me' : 'chat-bubble-opponent'}`}>
          <span className="chat-bubble-avatar">{getPlayerAvatar(sender)}</span>
          <div>
            <small>{visibleMessage.senderUid === uid ? 'You' : sender?.name || 'Opponent'}</small>
            <strong>{visibleMessage.text}</strong>
          </div>
        </div>
      )}

      <button
        className={`quick-chat-fab ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Quick chat"
      >
        <AppIcon name="chat" size={22} />
        <span className="quick-chat-fab-label">CHAT</span>
      </button>

      {open && (
        <div className="quick-chat-backdrop" onClick={() => setOpen(false)} role="presentation">
          <section className="quick-chat-sheet" onClick={(event) => event.stopPropagation()} aria-label="Quick chat">
            <div className="quick-chat-handle" />
            <div className="quick-chat-header">
              <div>
                <span>QUICK CHAT</span>
                <strong>Send a fast reaction</strong>
              </div>
              <button className="clean-icon-button quick-chat-close" type="button" onClick={() => setOpen(false)} aria-label="Close quick chat"><AppIcon name="close" /></button>
            </div>

            <div className="quick-message-grid">
              {suggestions.map((message) => (
                <button key={message} type="button" disabled={busy} onClick={() => send(message)}>
                  {message}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
