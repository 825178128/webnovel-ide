import { useEffect, useState } from 'react'
import { AppSettingsDialog } from './components/dialogs'
import { WorkspacePage, type MainView } from './pages/WorkspacePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { loadState, saveState, seedProjectDefaults } from './storage'
import type { Project, WebnovelIDEState } from './types'
import { createId, nowIso } from './utils'

export function App() {
  const [state, setState] = useState<WebnovelIDEState>(() => loadState())
  const [screen, setScreen] = useState<'projects' | 'workspace'>(
    state.activeProjectId ? 'workspace' : 'projects',
  )
  const [mainView, setMainView] = useState<MainView>('chapter')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>()
  const [selectedSettingId, setSelectedSettingId] = useState<string>()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [appSettingsOpen, setAppSettingsOpen] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const activeProject = state.projects.find((project) => project.id === state.activeProjectId)
  const activeChapter = state.chapters.find((chapter) => chapter.id === state.activeChapterId)

  function patchState(updater: (current: WebnovelIDEState) => WebnovelIDEState) {
    setState((current) => updater(current))
  }

  function openProject(projectId: string) {
    const firstChapter = state.chapters.find((chapter) => chapter.projectId === projectId)

    patchState((current) => ({
      ...current,
      activeProjectId: projectId,
      activeChapterId: firstChapter?.id,
    }))
    setMainView('chapter')
    setScreen('workspace')
  }

  function createProject(form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) {
    const timestamp = nowIso()
    const projectId = createId('project')
    const nextState = seedProjectDefaults(
      {
        ...state,
        projects: [
          ...state.projects,
          {
            id: projectId,
            userId: 'user_local',
            title: form.title,
            genre: form.genre,
            synopsis: form.synopsis,
            targetPlatform: form.targetPlatform,
            status: 'writing',
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      },
      projectId,
    )

    setState(nextState)
    setCreateProjectOpen(false)
    setScreen('workspace')
    setMainView('chapter')
  }

  if (screen === 'projects' || !activeProject) {
    return (
      <div className={`app-root theme-${state.appSettings?.theme ?? 'dark'}`}>
        <ProjectsPage
          state={state}
          createProjectOpen={createProjectOpen}
          appSettingsOpen={appSettingsOpen}
          onCreateProject={() => setCreateProjectOpen(true)}
          onOpenAppSettings={() => setAppSettingsOpen(true)}
          onOpenProject={openProject}
          onPatchState={patchState}
          onCloseCreateProject={() => setCreateProjectOpen(false)}
          onCloseAppSettings={() => setAppSettingsOpen(false)}
          onSubmitProject={createProject}
        />
      </div>
    )
  }

  return (
    <div className={`app-root theme-${state.appSettings?.theme ?? 'dark'}`}>
      <WorkspacePage
        state={state}
        project={activeProject}
        chapter={activeChapter}
        mainView={mainView}
        selectedCharacterId={selectedCharacterId}
        selectedSettingId={selectedSettingId}
        onBack={() => setScreen('projects')}
        onOpenAppSettings={() => setAppSettingsOpen(true)}
        onPatchState={patchState}
        onSelectChapter={(chapterId) => {
          patchState((current) => ({ ...current, activeChapterId: chapterId }))
          setMainView('chapter')
        }}
        onSelectCharacter={(characterId) => {
          setSelectedCharacterId(characterId)
          setMainView('character')
        }}
        onSelectSetting={(settingId) => {
          setSelectedSettingId(settingId)
          setMainView('setting')
        }}
        onSetMainView={setMainView}
      />
      {appSettingsOpen && (
        <AppSettingsDialog
          state={state}
          onClose={() => setAppSettingsOpen(false)}
          onPatchState={patchState}
        />
      )}
    </div>
  )
}
