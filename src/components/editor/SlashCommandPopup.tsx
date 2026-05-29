import { useEffect, useRef, useState } from 'react'
import type { SlashCommandItem } from './commands'

interface SlashCommandPopupProps {
  items: SlashCommandItem[]
  selectedIndex: number
  position: { top: number; left: number }
  onSelect: (item: SlashCommandItem) => void
}

export function SlashCommandPopup(props: SlashCommandPopupProps) {
  const { items, selectedIndex, position, onSelect } = props
  const listRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState(position)

  useEffect(() => {
    if (listRef.current) {
      const rect = listRef.current.getBoundingClientRect()
      const maxX = window.innerWidth - rect.width - 8
      const maxY = window.innerHeight - rect.height - 8
      setAdjustedPos({
        left: Math.min(position.left, maxX),
        top: Math.min(position.top, maxY),
      })
    }
  }, [position])

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (items.length === 0) {
    return (
      <div
        className="slash-command-popup"
        style={{ left: adjustedPos.left, top: adjustedPos.top }}
        ref={listRef}
      >
        <div className="slash-command-empty">无匹配命令</div>
      </div>
    )
  }

  return (
    <div
      className="slash-command-popup"
      style={{ left: adjustedPos.left, top: adjustedPos.top }}
      ref={listRef}
    >
      {items.map((item, index) => (
        <button
          className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
          key={item.id}
          onClick={() => onSelect(item)}
          onMouseEnter={() => {
            const parent = listRef.current
            if (parent) (parent.children[index] as HTMLElement)?.focus()
          }}
        >
          <span className="slash-command-icon">
            {item.type === 'character' && '\u{1F464}'}
            {item.type === 'setting' && '\u{1F4CB}'}
            {item.type === 'ai' && '\u2728'}
          </span>
          <div className="slash-command-text">
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </div>
        </button>
      ))}
    </div>
  )
}
