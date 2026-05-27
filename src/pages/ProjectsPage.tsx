import { AppSettingsDialog, CreateProjectDialog } from '../components/dialogs'
import { Icon } from '../components/Icon'
import type { Project, WebnovelIDEState } from '../types'
import { formatDateTime } from '../utils'

export interface ProjectsPageProps {
  state: WebnovelIDEState
  createProjectOpen: boolean
  appSettingsOpen: boolean
  onCreateProject: () => void
  onOpenAppSettings: () => void
  onCloseCreateProject: () => void
  onCloseAppSettings: () => void
  onOpenProject: (projectId: string) => void
  onPatchState: (updater: (current: WebnovelIDEState) => WebnovelIDEState) => void
  onSubmitProject: (form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) => void
}

export function ProjectsPage(props: ProjectsPageProps) {
  const totalWordCount = (projectId: string) =>
    props.state.chapters
      .filter((chapter) => chapter.projectId === projectId)
      .reduce((total, chapter) => total + chapter.wordCount, 0)

  const chapterCount = (projectId: string) =>
    props.state.chapters.filter((chapter) => chapter.projectId === projectId).length

  return (
    <div className="app-surface">
      <header className="projects-header">
        <div>
          <p className="eyebrow">Webnovel IDE</p>
          <h1>作品</h1>
        </div>
        <div className="header-actions">
          <button className="button-with-icon" onClick={props.onOpenAppSettings}>
            <Icon name="settings" />
            <span>应用设置</span>
          </button>
          <button className="primary-button button-with-icon" onClick={props.onCreateProject}>
            <Icon name="plus" />
            <span>新建作品</span>
          </button>
        </div>
      </header>

      {props.state.projects.length === 0 ? (
        <section className="empty-state">
          <h2>创建第一本作品</h2>
          <p>先建立作品工程，再逐步添加章节、人物、设定和 AI 辅助流程。</p>
          <button className="primary-button button-with-icon" onClick={props.onCreateProject}>
            <Icon name="plus" />
            <span>新建作品</span>
          </button>
        </section>
      ) : (
        <section className="project-grid">
          {props.state.projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div>
                <h2>{project.title}</h2>
                <p>{project.synopsis || '暂无简介'}</p>
              </div>
              <dl>
                <div>
                  <dt>题材</dt>
                  <dd>{project.genre || '未填写'}</dd>
                </div>
                <div>
                  <dt>平台</dt>
                  <dd>{project.targetPlatform || '未填写'}</dd>
                </div>
                <div>
                  <dt>章节</dt>
                  <dd>{chapterCount(project.id)}</dd>
                </div>
                <div>
                  <dt>字数</dt>
                  <dd>{totalWordCount(project.id)}</dd>
                </div>
              </dl>
              <div className="card-footer">
                <span>更新于 {formatDateTime(project.updatedAt)}</span>
                <button className="button-with-icon" onClick={() => props.onOpenProject(project.id)}>
                  <Icon name="book" />
                  <span>进入工作台</span>
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {props.createProjectOpen && (
        <CreateProjectDialog
          onClose={props.onCloseCreateProject}
          onSubmit={props.onSubmitProject}
        />
      )}
      {props.appSettingsOpen && (
        <AppSettingsDialog
          state={props.state}
          onClose={props.onCloseAppSettings}
          onPatchState={props.onPatchState}
        />
      )}
    </div>
  )
}
