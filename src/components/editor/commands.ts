import type { AITaskType, Character, Setting } from '../../types'

export interface SlashCommandItem {
  id: string
  label: string
  description: string
  type: 'character' | 'setting' | 'ai'
  insertText?: string
  aiTask?: AITaskType
  searchText: string
}

export function getSlashCommandItems(
  characters: Character[],
  settings: Setting[],
): SlashCommandItem[] {
  const items: SlashCommandItem[] = [
    {
      id: 'ai-continue',
      label: '续写',
      description: 'AI 继续撰写下文',
      type: 'ai',
      aiTask: 'continue',
      searchText: '续写 continue 继续 下文',
    },
    {
      id: 'ai-polish',
      label: '润色',
      description: 'AI 润色当前段落',
      type: 'ai',
      aiTask: 'polish',
      searchText: '润色 polish 优化 修改',
    },
    {
      id: 'ai-summarize',
      label: '总结',
      description: 'AI 总结当前章节',
      type: 'ai',
      aiTask: 'summarize',
      searchText: '总结 summarize 摘要',
    },
    {
      id: 'ai-rewrite',
      label: '改写',
      description: 'AI 改写当前段落',
      type: 'ai',
      aiTask: 'rewrite',
      searchText: '改写 rewrite 重写',
    },
  ]

  for (const char of characters) {
    items.push({
      id: `char-${char.id}`,
      label: char.name,
      description: char.role || '人物',
      type: 'character',
      insertText: char.name,
      searchText: `${char.name} ${char.role || ''} ${char.faction || ''}`,
    })
  }

  for (const setting of settings) {
    items.push({
      id: `setting-${setting.id}`,
      label: setting.title,
      description: `资料: ${setting.title}`,
      type: 'setting',
      insertText: setting.title,
      searchText: `${setting.title}`,
    })
  }

  return items
}
