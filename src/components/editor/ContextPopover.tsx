import { useEffect, useRef, useState } from 'react'
import type { Character, Setting } from '../../types'

interface ContextPopoverProps {
  selectedText: string
  position: { top: number; left: number }
  characters: Character[]
  settings: Setting[]
  onInsertSummary: () => void
  onClose: () => void
}

export function ContextPopover(props: ContextPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState(props.position)
  const onCloseRef = useRef(props.onClose)

  useEffect(() => { onCloseRef.current = props.onClose }, [props.onClose])

  const matchChar = props.characters.find(
    (c) => c.name === props.selectedText,
  )
  const matchSetting = props.settings.find(
    (s) => s.title === props.selectedText,
  )

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setAdjustedPos({
        left: Math.min(props.position.left, window.innerWidth - rect.width - 8),
        top: Math.min(props.position.top, window.innerHeight - rect.height - 8),
      })
    }
  }, [props.position])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current()
      }
    }
    document.addEventListener('mousedown', handleClick, true)
    return () => document.removeEventListener('mousedown', handleClick, true)
  }, [])

  if (!matchChar && !matchSetting) return null

  return (
    <div
      className="context-popover"
      ref={ref}
      style={{ left: adjustedPos.left, top: adjustedPos.top }}
    >
      {matchChar && (
        <div className="context-popover-content">
          <strong>{matchChar.name}</strong>
          {matchChar.role && <span className="muted">{matchChar.role}</span>}
          {matchChar.faction && <small>阵营: {matchChar.faction}</small>}
          {matchChar.personality && <p>{matchChar.personality}</p>}
          <button className="context-popover-action" onClick={props.onInsertSummary}>
            插入人物摘要
          </button>
        </div>
      )}
      {matchSetting && (
        <div className="context-popover-content">
          <strong>{matchSetting.title}</strong>
          <small>{matchSetting.content.slice(0, 100)}</small>
          <button className="context-popover-action" onClick={props.onInsertSummary}>
            插入设定摘要
          </button>
        </div>
      )}
    </div>
  )
}
