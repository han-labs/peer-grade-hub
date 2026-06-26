import React from 'react'

export default function PeerReviewStatusBadge({ submitted }) {
  return (
    <span
      className="status-badge"
      style={{
        gap: '7px',
        color: submitted ? 'var(--positive-text)' : 'var(--yellow)',
        background: submitted ? 'var(--positive-bg)' : 'var(--yellow-soft)',
        textTransform: 'capitalize',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.72rem',
        fontWeight: '720',
        minHeight: '28px',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: submitted ? '#5a9a47' : '#d4a106',
          display: 'inline-block',
        }}
      />
      {submitted ? 'Submitted' : 'Pending'}
    </span>
  )
}
