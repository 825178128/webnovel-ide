// Plain-text to TipTap-compatible HTML conversion.
// ProseMirror/TipTap internally uses HTML (or structured JSON).
// When we load content from storage (plain text with \n\n paragraph separators),
// we need to convert it to valid HTML so TipTap preserves paragraph structure.

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function textToTipTapHtml(text: string): string {
  if (!text) return '<p></p>'

  // If it already looks like HTML, use as-is (migrated content)
  if (text.trimStart().startsWith('<')) {
    return text
  }

  // Split by runs of newlines (paragraph separators)
  const paragraphs = text.split(/\n{2,}/)
  if (paragraphs.length === 0) return '<p></p>'

  return paragraphs
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return '<p></p>'
      const lines = trimmed.split('\n')
      if (lines.length <= 1) return `<p>${escapeHtml(lines[0])}</p>`
      return `<p>${lines.map((l) => escapeHtml(l.trim())).join('<br>')}</p>`
    })
    .join('')
}

// Strip HTML tags for word count / plain text export
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
