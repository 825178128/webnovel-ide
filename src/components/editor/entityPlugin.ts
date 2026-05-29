import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Character, Setting } from '../../types'

export const ENTITY_KEY = new PluginKey('entity-mention')

interface EntityData {
  characters: Character[]
  settings: Setting[]
}

export function createEntityPlugin(dataRef: { current: EntityData }) {
  return new Plugin({
    key: ENTITY_KEY,
    state: {
      init(_, { doc }) {
        return buildDecorations(doc, dataRef.current)
      },
      apply(tr, old) {
        if (!tr.docChanged && !tr.getMeta(ENTITY_KEY)) return old
        return buildDecorations(tr.doc, dataRef.current)
      },
    },
    props: {
      decorations(state) {
        return this.getState(state)
      },
    },
  })
}

function buildDecorations(doc: any, data: EntityData) {
  if (!doc) return DecorationSet.empty

  const decorations: Decoration[] = []
  const names = new Map<string, string>()

  for (const c of data.characters) {
    if (c.name) names.set(c.name, 'character')
  }
  for (const s of data.settings) {
    if (s.title) names.set(s.title, 'setting')
  }

  if (names.size === 0) return DecorationSet.empty

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) return true
    const text = node.text
    if (!text) return true

    for (const [name, type] of names) {
      let idx = 0
      while ((idx = text.indexOf(name, idx)) !== -1) {
        decorations.push(
          Decoration.inline(pos + idx, pos + idx + name.length, {
            class: `entity-mention entity-${type}`,
            'data-entity': name,
          }),
        )
        idx += name.length
      }
    }
  })

  return DecorationSet.create(doc, decorations)
}
