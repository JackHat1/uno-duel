import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const colors = [
  { id: 'red', label: 'Red', hint: 'Heat' },
  { id: 'yellow', label: 'Yellow', hint: 'Spark' },
  { id: 'green', label: 'Green', hint: 'Flow' },
  { id: 'blue', label: 'Blue', hint: 'Wave' },
]

function readViewport() {
  if (typeof window === 'undefined') {
    return { width: 390, height: 844, top: 0, left: 0 }
  }

  const viewport = window.visualViewport
  return {
    width: Math.round(viewport?.width || window.innerWidth || 390),
    height: Math.round(viewport?.height || window.innerHeight || 844),
    top: Math.round(viewport?.offsetTop || 0),
    left: Math.round(viewport?.offsetLeft || 0),
  }
}

export default function ColorPicker({ onSelect, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [viewport, setViewport] = useState(readViewport)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const update = () => setViewport(readViewport())
    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  const portalStyle = useMemo(() => ({
    position: 'fixed',
    zIndex: 10000,
    left: `${viewport.left}px`,
    top: `${viewport.top}px`,
    width: `${viewport.width}px`,
    height: `${viewport.height}px`,
  }), [viewport])

  const choose = (color) => {
    if (selected) return
    setSelected(color)
    window.setTimeout(() => onSelect(color), 240)
  }

  const content = (
    <div
      className={`color-picker-portal ${selected ? `is-choosing color-${selected}` : ''}`}
      style={portalStyle}
      role="presentation"
      onClick={selected ? undefined : onCancel}
    >
      <div className="color-picker-aurora" aria-hidden="true" />

      <div className="color-picker-viewport-stage">
        <section
          className="color-modal color-modal-v6 color-modal-ios"
          role="dialog"
          aria-modal="true"
          aria-label="Choose wild color"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="color-modal-heading">
            <span>WILD CARD</span>
            <h2>Choose the next color</h2>
            <p>Both players will see the color shift.</p>
          </div>

          <div className="wild-selector-stage" aria-hidden="true">
            <div className="wild-selector-card">
              <i className="wild-petal petal-red" />
              <i className="wild-petal petal-yellow" />
              <i className="wild-petal petal-green" />
              <i className="wild-petal petal-blue" />
              <strong>W</strong>
            </div>
            <div className="wild-selector-pulse" />
          </div>

          <div className="color-choice-grid color-choice-grid-v6">
            {colors.map((color) => (
              <button
                key={color.id}
                className={`color-choice-v6 choose-${color.id} ${selected === color.id ? 'selected' : ''}`}
                type="button"
                onClick={() => choose(color.id)}
                aria-label={`Choose ${color.label}`}
                disabled={Boolean(selected)}
              >
                <span className="color-choice-orb" />
                <span className="color-choice-copy">
                  <strong>{color.label}</strong>
                  <small>{color.hint}</small>
                </span>
                <span className="color-choice-check">✓</span>
              </button>
            ))}
          </div>

          <button
            className="premium-text-button color-cancel-v6"
            type="button"
            onClick={onCancel}
            disabled={Boolean(selected)}
          >
            Cancel
          </button>
        </section>
      </div>

      {selected && (
        <div className={`local-color-confirm color-${selected}`} aria-hidden="true">
          <span>COLOR</span>
          <strong>{selected.toUpperCase()}</strong>
        </div>
      )}
    </div>
  )

  return typeof document === 'undefined' ? null : createPortal(content, document.body)
}
