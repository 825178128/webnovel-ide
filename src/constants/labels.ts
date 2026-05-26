import type {
  AITaskType,
  ChapterStatus,
  ProjectStatus,
  SettingCategory,
  SettingImportance,
} from '../types'

export const chapterStatusLabels: Record<ChapterStatus, string> = {
  draft: '草稿',
  writing: '写作中',
  revision: '待修改',
  completed: '已完成',
}

export const settingCategoryLabels: Record<SettingCategory, string> = {
  world: '世界观',
  faction: '势力',
  power_system: '等级体系',
  item: '道具',
  location: '地点',
  rule: '规则',
  other: '其他',
}

export const settingImportanceLabels: Record<SettingImportance, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const aiTaskLabels: Record<AITaskType, string> = {
  continue: '续写',
  polish: '润色',
  summarize: '总结',
  rewrite: '改写',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: '筹备中',
  writing: '连载中',
  paused: '暂停',
  completed: '已完结',
  archived: '归档',
}
