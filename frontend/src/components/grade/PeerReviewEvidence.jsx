// frontend/src/components/grade/PeerReviewEvidence.jsx
import { UsersRound, Star } from 'lucide-react'
import { formatScore } from '../../utils/gradeUtils'

/**
 * Display peer review evidence for a group
 * Lecturer can see reviewer identity, students see anonymous
 */
export default function PeerReviewEvidence({ peerReviews, isPublished, isStudentView = false }) {
  if (!peerReviews || peerReviews.length === 0) {
    return (
      <div className="peer-review-evidence peer-review-evidence--empty">
        <p className="peer-review-evidence__empty-text">No peer reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="peer-review-evidence">
      <div className="peer-review-evidence__header">
        <span className="peer-review-evidence__badge">
          {peerReviews.length} peer review{peerReviews.length > 1 ? 's' : ''}
        </span>
      </div>

      {peerReviews.map((review, index) => (
        <div className="peer-review-item" key={index}>
          <div className="peer-review-item__header">
            <div className="peer-review-item__reviewer">
              <UsersRound size={14} aria-hidden="true" />
              <span>
                {isStudentView || !isPublished
                  ? review.anonymousReviewerName || 'Anonymous'
                  : review.reviewerGroupName}
              </span>
            </div>
            <div className="peer-review-item__score">
              <Star size={14} aria-hidden="true" />
              <strong>{formatScore(review.score)}</strong>
              <span>/ 100</span>
            </div>
          </div>
          <p className="peer-review-item__comment">{review.comment || 'No comment provided.'}</p>
          <span className="peer-review-item__date">
            Submitted: {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}