import { useEffect, useState } from 'react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

function App() {
  const [health, setHealth] = useState({
    status: 'checking',
    message: 'Checking backend connection...',
  })

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${apiBaseUrl}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        return response.json()
      })
      .then((data) => {
        setHealth({
          status: 'online',
          message: `${data.service ?? 'Backend API'} is ${data.status ?? 'UP'}`,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return
        }

        setHealth({
          status: 'offline',
          message: 'Backend is not reachable yet',
        })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="title-block">
          <p className="eyebrow">Peer review assessment management</p>
          <h1>PeerGrade Hub</h1>
          <p className="summary">
            A starter workspace for HCM-UTE course peer grading workflows.
          </p>
        </div>

        <div className="status-panel">
          <span className={`status-dot ${health.status}`} aria-hidden="true" />
          <div>
            <p className="status-label">Backend status</p>
            <p className="status-message">{health.message}</p>
            <p className="api-url">{apiBaseUrl}</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
