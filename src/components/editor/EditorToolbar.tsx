import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="editor-toolbar">
      <button
        className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="加粗 (Ctrl+B)"
        type="button"
      >
        <strong>B</strong>
      </button>
      <button
        className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="斜体 (Ctrl+I)"
        type="button"
      >
        <em>I</em>
      </button>
      <span className="toolbar-separator" />
      <button
        className="toolbar-btn"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="撤销 (Ctrl+Z)"
        type="button"
      >
        ↶
      </button>
      <button
        className="toolbar-btn"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="重做 (Ctrl+Shift+Z)"
        type="button"
      >
        ↷
      </button>
    </div>
  )
}
