import React from 'react'
import {
  ClipboardList,
  CalendarClock,
  Clock,
  ChevronRight,
  Edit2,
  Trash2,
  Link as LinkIcon,
  File
} from 'lucide-react'

export default function AssignmentCard({ assignment, onSelect, onEdit, onDelete, active = true }) {
  return (
    <div 
      className="assignment-card" 
      onClick={() => onSelect && onSelect(assignment.id)}
      style={{ cursor: 'pointer' }}
    >
      <div className="assignment-card__header">
        <div className="assignment-card__icon">
          <ClipboardList size={20} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="assignment-card__badge">
            <span className="status-badge status-badge--active">
              Appeal: {assignment.appealDays || 7}d
            </span>
          </div>
          <div className="assignment-card__badge">
            <span className="status-badge status-badge--active">
              {assignment.showcaseMode ? 'Showcase ON' : 'Showcase OFF'}
            </span>
          </div>
        </div>
      </div>

      <div className="assignment-card__body">
        <h3 className="assignment-card__title">{assignment.title}</h3>
        {assignment.description && (
          <p className="assignment-card__description">
            {assignment.description}
          </p>
        )}

        <div className="assignment-card__meta" style={{ marginBottom: '16px' }}>
          <div className="assignment-card__meta-item">
            <CalendarClock size={15} />
            <span>
              Submission: {assignment.submissionDeadline 
                ? new Date(assignment.submissionDeadline).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—'}
            </span>
          </div>
          <div className="assignment-card__meta-item">
            <Clock size={15} />
            <span>
              Review: {assignment.reviewDeadline 
                ? new Date(assignment.reviewDeadline).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—'}
            </span>
          </div>
        </div>

        {/* Materials display inside the card */}
        {assignment.materials && assignment.materials.length > 0 && (
          <div style={{ background: 'var(--page-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
            <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Guidelines &amp; Requirements:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {assignment.materials.map(mat => (
                <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #eef0eb', fontSize: '0.8rem' }}>
                  {mat.materialType === 'LINK' ? <LinkIcon size={12} style={{ color: 'var(--blue)' }} /> : <File size={12} style={{ color: 'var(--purple)' }} />}
                  <span>{mat.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="assignment-card__action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <button className="assignment-card__btn" type="button" style={{ pointerEvents: 'none' }}>
          Grade Assignment
          <ChevronRight size={18} />
        </button>
        {active && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="secondary-action" 
              onClick={(e) => {
                e.stopPropagation()
                onEdit && onEdit(assignment)
              }}
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit2 size={13} /> Edit
            </button>
            <button 
              type="button" 
              className="logout-button" 
              onClick={(e) => {
                e.stopPropagation()
                onDelete && onDelete(assignment.id)
              }}
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
