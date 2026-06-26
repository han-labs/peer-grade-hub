import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReviewTasks } from '../api/peerReviewAssignmentApi.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import PeerReviewTaskCard from '../components/peerreview/PeerReviewTaskCard.jsx'
import { ClipboardCheck, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function PeerReviewTasksPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, SUBMITTED

  useEffect(() => {
    if (user?.role !== 'STUDENT') return

    let mounted = true
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getReviewTasks(token)
        if (mounted) {
          // Double safeguard to filter active tasks whose due date has not passed in the frontend
          const activeTasks = (data || []).filter(task => {
            if (!task.dueAt) return true
            return new Date(task.dueAt) >= new Date()
          })
          setTasks(activeTasks)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load peer review tasks.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTasks()
    return () => {
      mounted = false
    }
  }, [token, user])

  if (user?.role !== 'STUDENT') {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={ClipboardCheck} label="Peer Review Tasks" />
        <main className="dashboard-main">
          <div className="form-alert">
            <AlertCircle size={18} />
            <span>Only students can access peer review tasks.</span>
          </div>
        </main>
      </div>
    )
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'PENDING') return !task.submitted
    if (filter === 'SUBMITTED') return task.submitted
    return true
  })

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={ClipboardCheck} label="Peer Review Tasks" />

      <main className="dashboard-main">
        <button
          className="back-link"
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--neutral-text)',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 0,
            marginBottom: '20px',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <section className="welcome-band" style={{ marginBottom: '32px' }}>
          <div>
            <p className="dashboard-date">UC-07 Peer Review</p>
            <h1 style={{ margin: '8px 0 4px', fontSize: '1.75rem', fontWeight: '800' }}>Peer Review Tasks</h1>
            <p style={{ margin: 0, color: 'var(--neutral-text)', fontSize: '0.94rem' }}>
              Manage your assigned peer review submissions.
            </p>
          </div>
        </section>

        {/* Tabs Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            type="button"
            className={`monitor-filter-chip ${filter === 'ALL' ? 'monitor-filter-chip--active' : ''}`}
            onClick={() => setFilter('ALL')}
            style={{
              minHeight: '36px',
              padding: '0 18px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontWeight: '650',
              cursor: 'pointer',
              background: filter === 'ALL' ? 'var(--ink)' : '#ffffff',
              color: filter === 'ALL' ? '#ffffff' : 'var(--neutral-text)',
              transition: 'all 0.2s',
            }}
          >
            All
          </button>
          <button
            type="button"
            className={`monitor-filter-chip ${filter === 'PENDING' ? 'monitor-filter-chip--active' : ''}`}
            onClick={() => setFilter('PENDING')}
            style={{
              minHeight: '36px',
              padding: '0 18px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontWeight: '650',
              cursor: 'pointer',
              background: filter === 'PENDING' ? 'var(--ink)' : '#ffffff',
              color: filter === 'PENDING' ? '#ffffff' : 'var(--neutral-text)',
              transition: 'all 0.2s',
            }}
          >
            Pending
          </button>
          <button
            type="button"
            className={`monitor-filter-chip ${filter === 'SUBMITTED' ? 'monitor-filter-chip--active' : ''}`}
            onClick={() => setFilter('SUBMITTED')}
            style={{
              minHeight: '36px',
              padding: '0 18px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontWeight: '650',
              cursor: 'pointer',
              background: filter === 'SUBMITTED' ? 'var(--ink)' : '#ffffff',
              color: filter === 'SUBMITTED' ? '#ffffff' : 'var(--neutral-text)',
              transition: 'all 0.2s',
            }}
          >
            Submitted
          </button>
        </div>

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '64px 0',
              color: 'var(--neutral-text)',
            }}
          >
            <Loader2 className="loading-spinner" size={24} />
            <span>Loading peer review tasks...</span>
          </div>
        ) : error ? (
          <div className="form-alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginTop: '16px',
            }}
          >
            <ClipboardCheck size={36} style={{ color: 'var(--muted-text)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--neutral-text)', margin: 0, fontSize: '0.9rem' }}>
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} peer review tasks found.
            </p>
          </div>
        ) : (
          <section className="peer-review-grid" aria-label="Peer review task list">
            {filteredTasks.map((task) => (
              <PeerReviewTaskCard key={task.id} task={task} />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
