import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { ChapterStatus, Character, Setting } from '../../types'
import { EditorHeader } from './EditorHeader'
import { EditorToolbar } from './EditorToolbar'
import { SlashCommandPopup } from './SlashCommandPopup'
import { ContextPopover } from './ContextPopover'
import { getSlashCommandItems, type SlashCommandItem } from './commands'
import { textToTipTapHtml } from './htmlUtils'
import { createEntityPlugin, ENTITY_KEY } from './entityPlugin'

interface TipTapEditorProps {
  contentKey: string
  content: string
  title: string
  goal: string
  status: ChapterStatus
  wordCount: number
  characters: Character[]
  settings: Setting[]
  editorFont?: string
  editorFontSize?: number
  editorLineHeight?: number
  onContentChange: (text: string) => void
  onTitleChange: (title: string) => void
  onGoalChange: (goal: string) => void
  onStatusChange: (status: ChapterStatus) => void
}

interface SlashMenuState {
  query: string
  position: { top: number; left: number }
  from: number
  to: number
}

export function TipTapEditor(props: TipTapEditorProps) {
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectionMenu, setSelectionMenu] = useState<{
    top: number
    left: number
    selectedText: string
  } | null>(null)

  const slashMenuRef = useRef<SlashMenuState | null>(null)
  const selectedIndexRef = useRef(0)

  useEffect(() => { slashMenuRef.current = slashMenu }, [slashMenu])
  useEffect(() => { selectedIndexRef.current = selectedIndex }, [selectedIndex])

  // Entity mention detection — stable ref + extension, so the ProseMirror
  // plugin is part of the initial config and never re-registered.
  const entityDataRef = useRef({ characters: props.characters, settings: props.settings })
  useEffect(() => {
    entityDataRef.current = { characters: props.characters, settings: props.settings }
  }, [props.characters, props.settings])

  const entityExtension = useMemo(() =>
    Extension.create({
      name: 'entityMention',
      addProseMirrorPlugins() {
        return [createEntityPlugin(entityDataRef)]
      },
    }),
  [])

  const allItems = getSlashCommandItems(props.characters, props.settings)

  function getFilteredItems(): SlashCommandItem[] {
    if (!slashMenuRef.current) return []
    const q = slashMenuRef.current.query.toLowerCase()
    if (!q) return allItems
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.searchText.toLowerCase().includes(q),
    ).slice(0, 10)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始写这一章...',
      }),
      entityExtension,
    ],
    content: textToTipTapHtml(props.content),
    onUpdate: ({ editor }) => {
      props.onContentChange(editor.getHTML())
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        // Global shortcuts (always active)
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault()
          return true
        }
        // Slash menu navigation
        if (!slashMenuRef.current) return false
        if (event.key === 'Escape') {
          setSlashMenu(null)
          return true
        }
        if (event.key === 'ArrowDown') {
          const items = getFilteredItems()
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
          return true
        }
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          return true
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault()
          const items = getFilteredItems()
          const selected = items[selectedIndexRef.current]
          if (selected) handleSlashSelect(selected)
          return true
        }
        return false
      },
    },
  })

  // Sync content into the editor when switching chapters (contentKey changes).
  // During normal typing, contentKey stays stable so we skip setContent
  // and avoid cursor jumps from the onUpdate -> state -> prop feedback loop.
  useEffect(() => {
    if (!editor || !editor.schema) return
    editor.commands.setContent(textToTipTapHtml(props.content))
  }, [props.contentKey])

  useEffect(() => {
    return () => editor?.destroy()
  }, [editor])

  // Force entity decorations to rebuild when character/setting data changes
  useEffect(() => {
    if (!editor) return
    const tr = editor.state.tr.setMeta(ENTITY_KEY, {})
    editor.view.dispatch(tr)
  }, [editor, props.characters, props.settings])

  const [entityHover, setEntityHover] = useState<{
    name: string
    type: 'character' | 'setting'
    top: number
    left: number
  } | null>(null)

  function handleEditorMouseOver(event: React.MouseEvent) {
    const target = event.target as HTMLElement
    const entitySpan = target.closest('.entity-mention') as HTMLElement | null
    if (!entitySpan) {
      setEntityHover(null)
      return
    }
    const name = entitySpan.getAttribute('data-entity')
    if (!name) { setEntityHover(null); return }
    const isChar = props.characters.some((c) => c.name === name)
    const isSetting = props.settings.some((s) => s.title === name)
    if (!isChar && !isSetting) { setEntityHover(null); return }
    const rect = entitySpan.getBoundingClientRect()
    setEntityHover({
      name,
      type: isChar ? 'character' : 'setting',
      top: rect.bottom + 4,
      left: rect.left,
    })
  }

  function getHoverEntitySummary(): string {
    if (!entityHover) return ''
    if (entityHover.type === 'character') {
      const c = props.characters.find((ch) => ch.name === entityHover.name)
      if (!c) return ''
      return `${c.name}${c.role ? ` · ${c.role}` : ''}${c.faction ? ` (${c.faction})` : ''}${c.personality ? `\n${c.personality}` : ''}`
    }
    const s = props.settings.find((st) => st.title === entityHover.name)
    if (!s) return ''
    return `${s.title}\n${s.content.slice(0, 120)}`
  }

  function updateSlashMenu() {
    if (!editor) return
    const { selection } = editor.state
    const { $from } = selection
    const textBefore = $from.parent.textBetween(
      Math.max(0, $from.parentOffset - 50),
      $from.parentOffset,
    )
    const slashIndex = textBefore.lastIndexOf('/')
    if (slashIndex >= 0) {
      const afterSlash = textBefore.slice(slashIndex + 1)
      if (!afterSlash.includes(' ')) {
        const coords = editor.view.coordsAtPos($from.pos)
        setSlashMenu({
          query: afterSlash,
          position: { top: coords.bottom + 4, left: coords.left },
          from: $from.pos - afterSlash.length - 1,
          to: $from.pos,
        })
        setSelectedIndex(0)
        setSelectionMenu(null)
        return
      }
    }
    setSlashMenu(null)
  }

  function updateSelectionMenu() {
    if (!editor) return
    const { selection } = editor.state
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to)
    if (!selectedText || selectedText.length > 100) {
      setSelectionMenu(null)
      return
    }
    const matchChar = props.characters.find((c) => c.name === selectedText.trim())
    const matchSetting = props.settings.find((s) => s.title === selectedText.trim())
    if (!matchChar && !matchSetting) {
      setSelectionMenu(null)
      return
    }
    const coords = editor.view.coordsAtPos(selection.to)
    setSelectionMenu({
      top: coords.bottom + 4,
      left: coords.left,
      selectedText: selectedText.trim(),
    })
  }

  useEffect(() => {
    if (!editor) return
    // Access view only when the editor is mounted. During first render
    // the ProseMirror view may not be ready — guard with a try-catch.
    let dom: HTMLElement | undefined
    try { dom = editor.view?.dom } catch { /* view not mounted yet */ }
    if (!dom) return
    const refresh = () => { updateSlashMenu(); updateSelectionMenu() }
    editor.on('update', refresh)
    editor.on('selectionUpdate', refresh)
    dom.addEventListener('scroll', refresh, { passive: true })
    return () => {
      editor.off('update', refresh)
      editor.off('selectionUpdate', refresh)
      dom!.removeEventListener('scroll', refresh)
    }
  }, [editor, props.characters, props.settings])

  function handleSlashSelect(item: SlashCommandItem) {
    if (!editor) return
    const menu = slashMenuRef.current
    if (!menu) return
    editor.chain().focus().deleteRange({ from: menu.from, to: menu.to }).run()
    setSlashMenu(null)
    if (item.insertText) {
      editor.chain().focus().insertContent(item.insertText).run()
    }
  }

  function handleContextAction() {
    if (!editor || !selectionMenu) return
    const matchChar = props.characters.find((c) => c.name === selectionMenu.selectedText)
    const matchSetting = props.settings.find((s) => s.title === selectionMenu.selectedText)
    const summary = matchChar
      ? `${matchChar.name}：${matchChar.role || ''}，${matchChar.personality || ''}`
      : matchSetting
        ? `${matchSetting.title}：${matchSetting.content.slice(0, 80)}`
        : ''
    if (summary) {
      editor.chain().focus().insertContentAt(editor.state.selection.to, `（${summary}）`).run()
    }
    setSelectionMenu(null)
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="tip-tap-editor">
      <EditorHeader
        title={props.title}
        goal={props.goal}
        wordCount={props.wordCount}
        status={props.status}
        onTitleChange={props.onTitleChange}
        onGoalChange={props.onGoalChange}
        onStatusChange={props.onStatusChange}
      />
      <EditorToolbar editor={editor} />
      <div className="editor-content-area" onMouseOver={handleEditorMouseOver} style={{
        fontFamily: props.editorFont || undefined,
        lineHeight: props.editorLineHeight ?? 2,
        '--editor-font-size': props.editorFontSize ? `${props.editorFontSize}px` : undefined,
      } as React.CSSProperties}>
        <EditorContent editor={editor} />
      </div>
      {entityHover && (
        <div className="entity-tooltip" style={{ top: entityHover.top, left: entityHover.left }}>
          {getHoverEntitySummary().split('\n').map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}
      {slashMenu && (
        <SlashCommandPopup
          items={filteredItems}
          selectedIndex={selectedIndex}
          position={slashMenu.position}
          onSelect={handleSlashSelect}
        />
      )}
      {selectionMenu && (
        <ContextPopover
          selectedText={selectionMenu.selectedText}
          position={{ top: selectionMenu.top, left: selectionMenu.left }}
          characters={props.characters}
          settings={props.settings}
          onInsertSummary={handleContextAction}
          onClose={() => setSelectionMenu(null)}
        />
      )}
    </div>
  )
}
