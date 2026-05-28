import { ensureDemoProject } from '../src/data/fixtures/demoProject'
import { recordSucceededAIRequest } from '../src/data/repositories/aiRepository'
import {
  appendChapterContent,
  createChapter,
  createVolume,
  deleteChapter,
} from '../src/data/repositories/chapterRepository'
import { createCharacter, deleteCharacter } from '../src/data/repositories/characterRepository'
import { createProject } from '../src/data/repositories/projectRepository'
import { toggleChapterCharacter, toggleChapterSetting } from '../src/data/repositories/relationRepository'
import { createSetting, deleteSetting } from '../src/data/repositories/settingRepository'
import { createInitialState } from '../src/data/store'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

let state = createInitialState()

assert(state.meta.schemaVersion === 1, 'initial state should include schema version')
assert(state.users.length === 1, 'initial state should include local user')

const demo = ensureDemoProject(state)
state = demo.state

const demoChapters = state.chapters.filter((chapter) => chapter.projectId === demo.projectId)
const demoCharacters = state.characters.filter((character) => character.projectId === demo.projectId)
const demoSettings = state.settings.filter((setting) => setting.projectId === demo.projectId)

assert(state.projects.some((project) => project.id === demo.projectId), 'demo project should exist')
assert(state.volumes.filter((volume) => volume.projectId === demo.projectId).length === 2, 'demo should include 2 volumes')
assert(demoChapters.length === 5, 'demo should include 5 chapters')
assert(demoCharacters.length === 3, 'demo should include 3 characters')
assert(demoSettings.length === 4, 'demo should include 4 settings')
assert(state.chapterCharacters.some((item) => item.chapterId === demoChapters[0].id), 'demo should include character relations')
assert(state.chapterSettings.some((item) => item.chapterId === demoChapters[0].id), 'demo should include setting relations')
assert(state.aiRequests.some((request) => request.projectId === demo.projectId), 'demo should include AI request history')

const projectResult = createProject(state, {
  title: 'Smoke Test Project',
  genre: '测试题材',
  synopsis: '用于数据层自检',
  targetPlatform: '本地',
})
state = projectResult.state

const smokeProject = state.projects.find((project) => project.title === 'Smoke Test Project')
assert(smokeProject, 'created project should exist')
assert(state.volumes.some((volume) => volume.projectId === smokeProject.id && volume.title === '第一卷'), 'created project should include default volume')
assert(state.chapters.some((chapter) => chapter.projectId === smokeProject.id && chapter.title === '第 1 章'), 'created project should include default chapter')

const volumeResult = createVolume(state, smokeProject.id, {
  title: '第二卷',
  summary: '新增卷',
})
state = volumeResult.state

const chapterResult = createChapter(state, smokeProject.id, volumeResult.volumeId, {
  title: '第 2 章',
  goal: '验证新增章节',
})
state = chapterResult.state

const characterResult = createCharacter(state, smokeProject.id, {
  name: '测试人物',
  role: '工具人',
  faction: '测试阵营',
})
state = characterResult.state

const settingResult = createSetting(state, smokeProject.id, {
  title: '测试设定',
  category: 'rule',
  content: '用于验证章节资料关联',
  importance: 'medium',
})
state = settingResult.state

state = toggleChapterCharacter(state, chapterResult.chapterId, characterResult.characterId)
state = toggleChapterSetting(state, chapterResult.chapterId, settingResult.settingId)
assert(
  state.chapterCharacters.some(
    (item) => item.chapterId === chapterResult.chapterId && item.characterId === characterResult.characterId,
  ),
  'chapter character relation should be created',
)
assert(
  state.chapterSettings.some(
    (item) => item.chapterId === chapterResult.chapterId && item.settingId === settingResult.settingId,
  ),
  'chapter setting relation should be created',
)

state = appendChapterContent(state, chapterResult.chapterId, '这是一段用于验证字数统计的正文。')
const updatedChapter = state.chapters.find((chapter) => chapter.id === chapterResult.chapterId)
assert(updatedChapter?.content.includes('字数统计'), 'chapter content should append text')
assert((updatedChapter?.wordCount ?? 0) > 0, 'chapter word count should update')

state = recordSucceededAIRequest(state, {
  projectId: smokeProject.id,
  chapterId: chapterResult.chapterId,
  taskType: 'continue',
  instruction: '继续写',
  inputSnapshot: '{}',
  output: 'AI 输出',
  provider: 'mock',
  model: 'local-prototype',
})
assert(
  state.aiRequests.some((request) => request.chapterId === chapterResult.chapterId && request.output === 'AI 输出'),
  'AI request should be recorded',
)

state = deleteCharacter(state, characterResult.characterId)
assert(!state.chapterCharacters.some((item) => item.characterId === characterResult.characterId), 'deleting character should remove relations')

state = deleteSetting(state, settingResult.settingId)
assert(!state.chapterSettings.some((item) => item.settingId === settingResult.settingId), 'deleting setting should remove relations')

state = deleteChapter(state, chapterResult.chapterId)
assert(!state.chapters.some((chapter) => chapter.id === chapterResult.chapterId), 'deleting chapter should remove chapter')
assert(!state.aiRequests.some((request) => request.chapterId === chapterResult.chapterId), 'deleting chapter should remove related AI requests')

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: [
        'schema meta',
        'demo fixture',
        'project defaults',
        'volume/chapter creation',
        'character/setting creation',
        'relations',
        'content append',
        'AI request record',
        'delete cascades',
      ],
    },
    null,
    2,
  ),
)
