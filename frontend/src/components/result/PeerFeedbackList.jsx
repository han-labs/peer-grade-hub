// frontend/src/components/result/PeerFeedbackList.jsx
import { MessageSquare, Star, Calendar } from 'lucide-react';

/**
 * List of anonymous peer feedback
 * BR-12: Reviewer identity is hidden from students
 */
export default function PeerFeedbackList({ feedbacks }) {
  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="peer-feedback-list">
        <div className="peer-feedback-list__header">
          <span className="peer-feedback-list__title">Peer Feedback</span>
          <span className="peer-feedback-list__count">0</span>
        </div>
        <p style={{ color: 'var(--neutral-text)', fontSize: '0.85rem', marginTop: '8px' }}>
          No peer feedback available.
        </p>
      </div>
    );
  }

  return (
    <div className="peer-feedback-list">
      <div className="peer-feedback-list__header">
        <span className="peer-feedback-list__title">Peer Feedback</span>
        <span className="peer-feedback-list__count">{feedbacks.length}</span>
      </div>

      {feedbacks.map((feedback, index) => (
        <div className="peer-feedback-item" key={index}>
          <div className="peer-feedback-item__header">
            <div className="peer-feedback-item__reviewer">
              <MessageSquare size={16} />
              <span>{feedback.anonymousReviewerName || `Reviewer ${index + 1}`}</span>
            </div>
            {feedback.score !== null && feedback.score !== undefined && (
              <span className="peer-feedback-item__score">
                <Star size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {feedback.score}
              </span>
            )}
          </div>

          {feedback.comment && (
            <p className="peer-feedback-item__comment">{feedback.comment}</p>
          )}

          {feedback.submittedAt && (
            <div className="peer-feedback-item__time">
              <Calendar size={12} />
              Submitted {new Date(feedback.submittedAt).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}