import React from 'react'
import { Calendar, ArrowRight, ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
        padding: '24px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
        position: 'relative',
        minHeight: '220px',
      }}
    >
      {/* Icon and Title block */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
        {/* Left icon in rounded square */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            minWidth: '40px',
            background: 'var(--green-soft)',
            color: 'var(--green)',
            borderRadius: '8px',
          }}
        >
          <ClipboardCheck size={20} />
        </div>

        <div style={{ flex: 1 }}>
          <span className="eyebrow" style={{ color: 'var(--green)', margin: 0 }}>Peer Review Task</span>
          <h2
            style={{
              margin: '4px 0 4px',
              fontSize: '1.05rem',
              fontWeight: '700',
              color: 'var(--primary-text)',
              lineHeight: '1.3',
            }}
          >
            {assignmentTitle}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.84rem',
              color: 'var(--neutral-text)',
            }}
          >
            Review {revieweeGroupName}'s submission
          </p>
        </div>
      </div>

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neutral-text)', fontSize: '0.76rem' }}>
            <Calendar size={14} />
            <span>Due: {formatDate(dueAt)}</span>
          </div>
          {/* Status Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: '600',
              background: submitted ? 'var(--positive-bg)' : 'var(--yellow-soft)',
              color: submitted ? 'var(--positive-text)' : 'var(--yellow)',
              alignSelf: 'flex-start',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'currentColor',
              }}
            />
            {submitted ? 'Submitted' : 'Pending'}
          </span>
        </div>

        {/* Right-aligned button */}
        <button
          type="button"
          onClick={() => navigate(`/peer-reviews/tasks/${id}`)}
          className="primary-button"
          style={{
            minHeight: '36px',
            height: '36px',
            fontSize: '0.76rem',
            fontWeight: 650,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--ink)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9px',
            padding: '0 14px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          Submit Peer Review
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  )
}
