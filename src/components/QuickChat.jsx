import { useEffect, useMemo, useRef, useState } from 'react'
import { QUICK_MESSAGES } from '../services/chatService'
import { getPlayerAvatar } from '../lib/playerVisuals'
import AppIcon from './AppIcon'

export default function QuickChat({ latestMessage, uid, me, opponent, busy, onSend, onIncoming, onTap, onSendSound }) {
  const [open, setOpen] = useState(false)
  const [visibleMessage, setVisibleMessage] = useState(null)
  const lastMessageId = useRef(null)
  const popoverRef = useRef(null)
  const buttonRef = useRef(null)

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

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      const target = event.target
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const sender = visibleMessage?.senderUid === uid ? me : opponent
  const suggestions = useMemo(() => QUICK_MESSAGES, [])

  const send = async (text) => {
    onSendSound?.()
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
        ref={buttonRef}
        className={`quick-chat-fab quick-chat-fab-mini ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => { onTap?.(); setOpen((current) => !current) }}
        aria-label="Quick chat"
      >
        <AppIcon name="chat" size={18} />
      </button>

      {open && (
        <section
          ref={popoverRef}
          className="quick-chat-popover"
          aria-label="Quick chat"
        >
          <div className="quick-chat-header compact-chat-header">
            <div>
              <span>QUICK CHAT</span>
              <strong>Send a reaction</strong>
            </div>
            <button className="clean-icon-button quick-chat-close" type="button" onClick={() => setOpen(false)} aria-label="Close quick chat"><AppIcon name="close" /></button>
          </div>

          <div className="quick-message-grid compact-message-grid">
            {suggestions.map((message) => (
              <button key={message} type="button" disabled={busy} onClick={() => send(message)}>
                {message}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
