// frontend/src/components/result/ShowcaseSubmissionCard.jsx
import { FileText, Link2, Calendar, User, Eye, EyeOff } from 'lucide-react';
import PeerFeedbackList from './PeerFeedbackList';

/**
 * One group's submission in the Class Gallery
 * BR-15: Only shows final score if the group's grade is published
 */
export default function ShowcaseSubmissionCard({ submission, isCurrentGroup }) {
  if (!submission) return null;

  const {
    groupId,
    groupName,
    submittedAt,
    submitterName,
    submissionNote,
    attachments = [],
    finalScore,
    isPublished,
    peerFeedbacks = [],
  } = submission;

  const hasScore = isPublished && finalScore !== null && finalScore !== undefined;
  const hasAttachments = attachments.length > 0;

  return (
    <div className="showcase-submission-card">
      {/* Header: Group Name + Info */}
      <div className="showcase-submission-card__header">
        <div className="showcase-submission-card__group">
          <span className="showcase-submission-card__group-icon">
            <FileText size={18} />
          </span>
          <div>
            <div className="showcase-submission-card__group-name">
              {groupName || `Group ${groupId}`}
              {isCurrentGroup && (
                <span className="showcase-submission-card__current-badge" style={{ 
                  marginLeft: '8px',
                  fontSize: '0.6rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'var(--blue-soft)',
                  color: 'var(--blue)',
                  fontWeight: 600
                }}>
                  Your Group
                </span>
              )}
            </div>
            <div className="showcase-submission-card__meta">
              {submittedAt && (
                <span>
                  <Calendar size={12} />
                  Submitted {new Date(submittedAt).toLocaleString()}
                </span>
              )}
              {submitterName && (
                <span>
                  <User size={12} />
                  by {submitterName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score (BR-15: only if published) */}
        <div className="showcase-submission-card__score-wrapper">
          {hasScore ? (
            <span className="showcase-submission-card__score showcase-submission-card__score--published">
              <Eye size={14} />
              {finalScore} / 100
            </span>
          ) : (
            <span className="showcase-submission-card__score showcase-submission-card__score--hidden">
              <EyeOff size={14} />
              Not published
            </span>
          )}
        </div>
      </div>

      {/* Body: Note + Attachments */}
      <div className="showcase-submission-card__body">
        {submissionNote && (
          <p className="showcase-submission-card__note">{submissionNote}</p>
        )}

        {hasAttachments && (
          <div className="showcase-submission-card__attachments">
            {attachments.map((att, index) => {
              const isLink = att.attachmentType === 'LINK';
              return (
                <span className="showcase-submission-card__attachment" key={index}>
                  {isLink ? <Link2 size={12} /> : <FileText size={12} />}
                  {att.title || att.fileName || att.url || 'Attachment'}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Peer Feedback (anonymous) */}
      {peerFeedbacks.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <PeerFeedbackList feedbacks={peerFeedbacks} />
        </div>
      )}
    </div>
  );
}