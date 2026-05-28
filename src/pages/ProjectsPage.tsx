import { CreateProjectDialog } from '../components/dialogs'
import { Icon } from '../components/Icon'
import { projectStatusLabels } from '../constants/labels'
import { useDataStore } from '../data/DataContext'
import type { Project } from '../types'
import { formatDateTime } from '../utils'

export interface ProjectsPageProps {
  createProjectOpen: boolean
  appSettingsOpen: boolean
  onCreateProject: () => void
  onOpenAppSettings: () => void
  onLoadDemoProject: () => void
  onCloseCreateProject: () => void
  onCloseAppSettings: () => void
  onOpenProject: (projectId: string) => void
  onSubmitProject: (form: Pick<Project, 'title' | 'genre' | 'synopsis' | 'targetPlatform'>) => void
}

export function ProjectsPage(props: ProjectsPageProps) {
  const { state } = useDataStore()
  const totalProjects = state.projects.length
  const totalChapters = state.chapters.length
  const totalWords = state.chapters.reduce((total, chapter) => total + chapter.wordCount, 0)

  const totalWordCount = (projectId: string) =>
    state.chapters
      .filter((chapter) => chapter.projectId === projectId)
      .reduce((total, chapter) => total + chapter.wordCount, 0)

  const chapterCount = (projectId: string) =>
    state.chapters.filter((chapter) => chapter.projectId === projectId).length

  return (
    <div className="app-surface">
      <header className="projects-header">
        <div className="projects-heading">
          <div>
            <p className="eyebrow">Webnovel IDE</p>
            <h1>作品库</h1>
          </div>
          <div className="projects-overview" aria-label="作品概览">
            <span><strong>{totalProjects}</strong> 本作品</span>
            <span><strong>{totalChapters}</strong> 章</span>
            <span><strong>{totalWords}</strong> 字</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="button-with-icon" onClick={props.onOpenAppSettings}>
            <Icon name="settings" />
            <span>应用设置</span>
          </button>
          <button className="button-with-icon" onClick={props.onLoadDemoProject}>
            <Icon name="database" />
            <span>载入演示数据</span>
          </button>
          <button className="primary-button button-with-icon" onClick={props.onCreateProject}>
            <Icon name="plus" />
            <span>新建作品</span>
          </button>
        </div>
      </header>

      <main className="projects-main">
        <div className="projects-main-header">
          <div>
            <h2>最近作品</h2>
            <p>管理正在创作的长篇项目。</p>
          </div>
        </div>

        {state.projects.length === 0 ? (
          <section className="empty-state">
            <div>
              <h2>创建第一本作品</h2>
              <p>从作品工程开始组织章节、人物、设定和写作入口。</p>
            </div>
            <div className="empty-state-actions">
              <button className="button-with-icon" onClick={props.onLoadDemoProject}>
                <Icon name="database" />
                <span>载入演示数据</span>
              </button>
              <button className="primary-button button-with-icon" onClick={props.onCreateProject}>
                <Icon name="plus" />
                <span>新建作品</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="project-grid">
            {state.projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-header">
                  <div>
                    <h2>{project.title}</h2>
                    <p>{project.synopsis || '暂无简介'}</p>
                  </div>
                  <span className="project-status">{projectStatusLabels[project.status]}</span>
                </div>
                <dl className="project-stats">
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
                  <span>更新 {formatDateTime(project.updatedAt)}</span>
                  <button className="button-with-icon" onClick={() => props.onOpenProject(project.id)}>
                    <Icon name="book" />
                    <span>进入工作台</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {props.createProjectOpen && (
        <CreateProjectDialog
          onClose={props.onCloseCreateProject}
          onSubmit={props.onSubmitProject}
        />
      )}
    </div>
  )
}
