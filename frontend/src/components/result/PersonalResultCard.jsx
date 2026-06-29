// frontend/src/components/result/PersonalResultCard.jsx
import { User, MessageSquare, Calendar, CheckCircle2 } from 'lucide-react';
import PeerFeedbackList from './PeerFeedbackList';

/**
 * Display personal results for a student's group
 * Includes: final score, lecturer comment, published info, peer feedback
 */
export default function PersonalResultCard({ result }) {
  if (!result) return null;

  const {
    groupId,
    groupName,
    finalScore,
    lecturerComment,
    publishedAt,
    publishedBy,
    peerFeedbacks = [],
  } = result;

  const hasComment = lecturerComment && lecturerComment.trim().length > 0;
  const hasPeerFeedback = peerFeedbacks.length > 0;

  return (
    <div className="personal-result-card">
      {/* Header: Group Name + Score */}
      <div className="personal-result-card__header">
        <div>
          <div className="personal-result-card__group">
            <span className="personal-result-card__group-icon">
              <User size={18} />
            </span>
            <span className="personal-result-card__group-name">
              {groupName || `Group ${groupId}`}
            </span>
          </div>
          <div className="personal-result-card__meta">
            {publishedAt && (
              <span>
                <Calendar size={14} />
                Published {new Date(publishedAt).toLocaleString()}
              </span>
            )}
            {publishedBy && (
              <span>
                <CheckCircle2 size={14} />
                by {publishedBy}
              </span>
            )}
          </div>
        </div>
        <div className="personal-result-card__score">
          <span className="personal-result-card__score-value">
            {finalScore !== null && finalScore !== undefined ? finalScore : '-'}
          </span>
          <span className="personal-result-card__score-max">/ 100</span>
        </div>
      </div>

      {/* Lecturer Comment */}
      {hasComment && (
        <div className="personal-result-card__comment">
          <div className="personal-result-card__comment-label">
            <MessageSquare size={14} />
            Lecturer's Comment
          </div>
          <p className="personal-result-card__comment-text">{lecturerComment}</p>
        </div>
      )}

      {/* Peer Feedback List */}
      {hasPeerFeedback ? (
        <PeerFeedbackList feedbacks={peerFeedbacks} />
      ) : (
        <div className="peer-feedback-list">
          <div className="peer-feedback-list__header">
            <span className="peer-feedback-list__title">Peer Feedback</span>
            <span className="peer-feedback-list__count">0</span>
          </div>
          <p className="personal-result-card__empty-feedback" style={{ color: 'var(--neutral-text)', fontSize: '0.85rem', marginTop: '8px' }}>
            No peer feedback available for your group yet.
          </p>
        </div>
      )}
    </div>
  );
}