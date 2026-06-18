import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // you could log to an external service here
    console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: '#fff6f6', color: '#6b0000' }}>
          <h3>Coś poszło nie tak w komponencie Kanban.</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
