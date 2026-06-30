// frontend/src/components/grade/GroupGradeCard.jsx
import { useState } from 'react'
import { ChevronDown, ChevronRight, Users, AlertCircle } from 'lucide-react'
import EvidencePanel from './EvidencePanel'
import GradeForm from './GradeForm'
import { getStatusLabel, getGroupStatus, canPublishGroup } from '../../utils/gradeUtils'

export default function GroupGradeCard({
  group,
  gradeEntry,
  onGradeChange,
  onSelect,
  selected,
  onPublish,
  onSaveDraft,
  onUnpublish,
  isSubmitting,
  saveError, 
}) {
  const [expanded, setExpanded] = useState(false)

  const status = getGroupStatus(group)
  const statusLabel = getStatusLabel(group)
  const canPublish = canPublishGroup(group)
  const isPublished = group.isPublished

  const statusClassMap = {
    'published': 'badge--published',
    'draft': 'badge--draft',
    'no-submission': 'badge--warning',
    'pending': 'badge--pending',
  }

  const statusIconMap = {
    'no-submission': <AlertCircle size={14} />,
    'published': null,
    'draft': null,
    'pending': null,
  }

  const handleToggleExpand = (e) => {
    if (!e.target.closest('input[type="checkbox"]') && !e.target.closest('button')) {
      setExpanded(!expanded)
    }
  }

  return (
    <div className={`group-grade-card ${selected ? 'group-grade-card--selected' : ''}`}>
      <div className="group-grade-card__header" onClick={handleToggleExpand}>
        <div className="group-grade-card__info">
          <span className="group-grade-card__name">{group.groupName}</span>
          <span className="group-grade-card__member-count">
            <Users size={14} />
            {group.memberCount || 0} members
          </span>
        </div>

        <div className="group-grade-card__meta">
          <span className={`badge ${statusClassMap[status] || ''}`}>
            {statusIconMap[status]}
            {statusLabel}
          </span>

          {/* Disable checkbox khi đã publish */}
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect(e.target.checked)
            }}
            disabled={isPublished || !canPublish}  
            className="group-grade-card__checkbox"
          />

          <button
            className="group-grade-card__toggle"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            type="button"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="group-grade-card__body">

            {saveError && (
            <div className="group-grade-card__error">
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}
          <EvidencePanel
            hasSubmission={group.hasSubmission}
            submittedAt={group.submittedAt}
            submitterName={group.submitterName}
            submissionNote={group.submissionNote}
            attachments={group.attachments}
            hasPeerReview={group.hasPeerReview}
            peerReviews={group.peerReviews}
            isPublished={isPublished}
          />

          {!group.hasSubmission && (
                <div className="group-grade-card__error">
                    <AlertCircle size={16} />
                    <span>Cannot publish grade for {group.groupName} because the group has not submitted the assignment.</span>
                </div>
        )}

          <GradeForm
            groupId={group.groupId}
            score={gradeEntry?.score || ''}
            comment={gradeEntry?.comment || ''}
            isPublished={isPublished}
            canPublish={canPublish}
            onScoreChange={(value) => onGradeChange(group.groupId, 'score', value)}
            onCommentChange={(value) => onGradeChange(group.groupId, 'comment', value)}
            onPublish={() => onPublish(group.groupId)}
            onSaveDraft={() => onSaveDraft(group.groupId)}
            onUnpublish={() => onUnpublish(group.groupId)}
            isLoading={isSubmitting}
          />
        </div>
      )}
    </div>
  )
}