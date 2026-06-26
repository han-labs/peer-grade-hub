import React from 'react'
import { Calendar, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PeerReviewStatusBadge from './PeerReviewStatusBadge.jsx'

export default function PeerReviewTaskCard({ task }) {
  const navigate = useNavigate()
  const { id, assignmentTitle, revieweeGroupName, dueAt, submitted } = task

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <article
      className="stat-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        minHeight: '200px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--blue)' }}>Peer Review Task</span>
          <h2
            style={{
              margin: '6px 0 4px',
              fontSize: '1.05rem',
              fontWeight: '700',
              color: 'var(--primary-text)',
            }}
          >
            {assignmentTitle}
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '0.84rem',
              color: 'var(--neutral-text)',
            }}
          >
            Review {revieweeGroupName}'s submission
          </p>
        </div>
        <PeerReviewStatusBadge submitted={submitted} />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-text)', fontSize: '0.78rem' }}>
          <Calendar size={16} />
          <span>Due: {formatDate(dueAt)}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/peer-reviews/tasks/${id}`)}
          className="compact-primary-action"
          style={{
            minHeight: '36px',
            height: '36px',
            fontSize: '0.76rem',
            padding: '0 16px',
          }}
        >
          {submitted ? 'Edit Review' : 'Open Review'}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  )
}
