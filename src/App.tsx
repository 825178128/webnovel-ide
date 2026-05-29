import { useState } from 'react'
import { AppSettingsDialog } from './components/dialogs'
import { WorkspacePage, type MainView } from './pages/WorkspacePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { DataProvider, useDataStore } from './data/DataContext'
import { ensureDemoProject } from './data/fixtures/demoProject'
import { createProject as createProjectRecord } from './data/repositories/projectRepository'
import type { Project } from './types'

function AppInner() {
  const { state, patchState } = useDataStore()
  const [screen, setScreen] = useState<'projects' | 'workspace'>('projects')
  const [activeProjectId, setActiveProjectId] = useState<string>()
  const [activeChapterId, setActiveChapterId] = useState<string>()
  const [mainView, setMainView] = useState<MainView>('chapter')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>()
  const [selectedSettingId, setSelectedSettingId] = useState<string>()
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [appSettingsOpen, setAppSettingsOpen] = useState(false)

  const activeProject = activeProjectId ? state.projects.find((project) => project.id === activeProjectId) : undefined
  const activeChapter = activeChapterId ? state.chapters.find((chapter) => chapter.id === activeChapterId) : undefined

  function openProject(projectId: string) {
    const firstChapter = state.chapters.find((chapter) => chapter.projectId === projectId)
    setActiveProjectId(projectId)
    setActiveChapterId(firstChapter?.id)
    setMainView('chapter')
    setScreen('workspace')
  }

  function createProject(form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) {
    const result = createProjectRecord(state, form)
    patchState(() => result.state)
    setActiveProjectId(result.projectId)
    setActiveChapterId(result.firstChapterId)
    setCreateProjectOpen(false)
    setScreen('workspace')
    setMainView('chapter')
  }

  function loadDemoProject() {
    const result = ensureDemoProject(state)
    patchState(() => result.state)
    setActiveProjectId(result.projectId)
    setActiveChapterId(result.firstChapterId)
    setScreen('workspace')
    setMainView('chapter')
  }

  function selectChapter(chapterId: string) {
    setActiveChapterId(chapterId)
    setMainView('chapter')
  }

  const theme = state.appSettings?.theme ?? 'dark'

  if (screen === 'projects' || !activeProject) {
    return (
      <div className={`app-root theme-${theme}`}>
        <ProjectsPage
          createProjectOpen={createProjectOpen}
          appSettingsOpen={appSettingsOpen}
          onCreateProject={() => setCreateProjectOpen(true)}
          onOpenAppSettings={() => setAppSettingsOpen(true)}
          onLoadDemoProject={loadDemoProject}
          onOpenProject={openProject}
          onCloseCreateProject={() => setCreateProjectOpen(false)}
          onCloseAppSettings={() => setAppSettingsOpen(false)}
          onSubmitProject={createProject}
        />
        {appSettingsOpen && (
          <AppSettingsDialog
            onClose={() => setAppSettingsOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`app-root theme-${theme}`}>
      <WorkspacePage
        project={activeProject}
        chapter={activeChapter}
        mainView={mainView}
        selectedCharacterId={selectedCharacterId}
        selectedSettingId={selectedSettingId}
        onBack={() => setScreen('projects')}
        onOpenAppSettings={() => setAppSettingsOpen(true)}
        onSelectChapter={selectChapter}
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
          onClose={() => setAppSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  )
}
