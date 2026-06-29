// frontend/src/components/result/ClassGallery.jsx
import { UsersRound, AlertCircle } from 'lucide-react';
import ShowcaseSubmissionCard from './ShowcaseSubmissionCard';

/**
 * Class Gallery - Showcase Mode
 * Displays other groups' submissions and anonymous peer feedback
 * BR-15: Only shows final grades if the group's grade is published
 */
export default function ClassGallery({ gallery, currentGroupId }) {
  if (!gallery) {
    return (
      <div className="class-gallery__empty">
        <UsersRound size={40} className="class-gallery__empty-icon" />
        <h3>Gallery not available</h3>
        <p>Class Gallery is not enabled for this assignment.</p>
      </div>
    );
  }

  if (gallery.enabled === false) {
    return (
      <div className="class-gallery__empty">
        <UsersRound size={40} className="class-gallery__empty-icon" />
        <h3>Gallery is disabled</h3>
        <p>{gallery.message || 'Lecturer has not permitted viewing other groups\' submissions.'}</p>
      </div>
    );
  }

  const submissions = gallery.submissions || [];

  if (submissions.length === 0) {
    return (
      <div className="class-gallery__empty">
        <UsersRound size={40} className="class-gallery__empty-icon" />
        <h3>No submissions to display</h3>
        <p>{gallery.message || 'No other groups have submitted yet.'}</p>
      </div>
    );
  }

  return (
    <div className="class-gallery">
      <div className="class-gallery__header">
        <p className="eyebrow">Class Gallery</p>
        <h2>Other Groups' Submissions</h2>
        <p className="class-gallery__subtitle">
          Browse submissions and anonymous peer feedback from other groups.
          {currentGroupId && (
            <span className="class-gallery__exclude-hint">
              <AlertCircle size={14} />
              Your group's submission is excluded from this view.
            </span>
          )}
        </p>
      </div>

      <div className="class-gallery__grid">
        {submissions.map((submission) => (
          <ShowcaseSubmissionCard
            key={submission.groupId}
            submission={submission}
            isCurrentGroup={submission.groupId === currentGroupId}
          />
        ))}
      </div>
    </div>
  );
}