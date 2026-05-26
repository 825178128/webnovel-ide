import { CreateProjectDialog, AISettingsDialog } from '../components/dialogs'
import type { Project, WebnovelIDEState } from '../types'
import { formatDateTime } from '../utils'

export interface ProjectsPageProps {
  state: WebnovelIDEState
  createProjectOpen: boolean
  aiSettingsOpen: boolean
  onCreateProject: () => void
  onOpenAISettings: () => void
  onCloseCreateProject: () => void
  onCloseAISettings: () => void
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
          <button onClick={props.onOpenAISettings}>AI 配置</button>
          <button className="primary-button" onClick={props.onCreateProject}>
            新建作品
          </button>
        </div>
      </header>

      {props.state.projects.length === 0 ? (
        <section className="empty-state">
          <h2>创建第一本作品</h2>
          <p>先建立作品工程，再逐步添加章节、人物、设定和 AI 辅助流程。</p>
          <button className="primary-button" onClick={props.onCreateProject}>
            新建作品
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
                <button onClick={() => props.onOpenProject(project.id)}>进入工作台</button>
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
      {props.aiSettingsOpen && (
        <AISettingsDialog
          config={props.state.aiConfig}
          onClose={props.onCloseAISettings}
          onPatchState={props.onPatchState}
        />
      )}
    </div>
  )
}
