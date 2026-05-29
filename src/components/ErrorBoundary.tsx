import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>渲染错误</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 6 }}>
            {this.state.error.stack || this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
