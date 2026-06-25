// frontend/src/components/grade/PublishConfirmationModal.jsx
import { AlertCircle, X } from 'lucide-react'

export default function PublishConfirmationModal({
  isOpen,
  groupName,
  hasPeerReview,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div 
        className="confirm-dialog" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="publish-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="confirm-dialog__close" onClick={onCancel} type="button">
          <X size={20} />
        </button>

        <span className="confirm-dialog__icon">
          <AlertCircle size={22} />
        </span>

        <h2 id="publish-confirm-title">Publish grade for {groupName}?</h2>

        {!hasPeerReview && (
          <div className="confirm-dialog__warning">
            ⚠️ <strong>{groupName}</strong> has not received any peer review. 
            Do you still want to publish the grade?
          </div>
        )}

        <p>
          Once published, students in this group will be able to see their final grade
          and feedback.
        </p>

        <div className="confirm-dialog__actions">
          <button className="secondary-action" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="primary-button" onClick={onConfirm} type="button">
            Confirm Publish
          </button>
        </div>
      </div>
    </div>
  )
}