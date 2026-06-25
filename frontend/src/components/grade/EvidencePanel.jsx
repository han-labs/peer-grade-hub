// frontend/src/components/grade/EvidencePanel.jsx
import { useState } from 'react'
import { FileText, Link2, ChevronDown, ChevronRight } from 'lucide-react'
import PeerReviewEvidence from './PeerReviewEvidence'

/**
 * Display submission evidence and peer reviews for a group
 */
export default function EvidencePanel({ 
  hasSubmission, 
  submission, 
  hasPeerReview, 
  peerReviews,
  isPublished,
  isStudentView = false 
}) {
  const [expanded, setExpanded] = useState(false)

  const hasEvidence = hasSubmission || hasPeerReview

  if (!hasEvidence) {
    return (
      <div className="evidence-panel evidence-panel--empty">
        <p className="evidence-panel__empty-text">No submission or peer review available.</p>
      </div>
    )
  }

  return (
    <div className="evidence-panel">
      <button 
        className="evidence-panel__toggle"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span className="evidence-panel__toggle-label">
          {expanded ? 'Hide' : 'Show'} evidence
        </span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {expanded && (
        <div className="evidence-panel__body">
          {/* Submission */}
          {hasSubmission && submission && (
            <div className="evidence-panel__section">
              <div className="evidence-panel__section-header">
                <h4>Submission</h4>
                {submission.submittedAt && (
                  <span className="evidence-panel__section-date">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {submission.submitterName && (
                <p className="evidence-panel__submitter">
                  Submitted by: <strong>{submission.submitterName}</strong>
                </p>
              )}
              {submission.submissionNote && (
                <p className="evidence-panel__note">{submission.submissionNote}</p>
              )}
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="evidence-panel__attachments">
                  {submission.attachments.map((att, i) => (
                    <div className="evidence-panel__attachment" key={i}>
                      {att.attachmentType === 'LINK' ? (
                        <Link2 size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                      {att.url ? (
                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                          {att.title || att.fileName || att.url}
                        </a>
                      ) : (
                        <span>{att.title || att.fileName}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Peer Reviews */}
          {hasPeerReview && peerReviews && peerReviews.length > 0 && (
            <div className="evidence-panel__section">
              <div className="evidence-panel__section-header">
                <h4>Peer Reviews</h4>
                <span className="evidence-panel__section-count">
                  {peerReviews.length} review{peerReviews.length > 1 ? 's' : ''}
                </span>
              </div>
              <PeerReviewEvidence 
                peerReviews={peerReviews}
                isPublished={isPublished}
                isStudentView={isStudentView}
              />
            </div>
          )}

          {/* No Peer Review Warning */}
          {hasSubmission && !hasPeerReview && (
            <div className="evidence-panel__warning">
              This group has not received any peer review.
            </div>
          )}
        </div>
      )}
    </div>
  )
}