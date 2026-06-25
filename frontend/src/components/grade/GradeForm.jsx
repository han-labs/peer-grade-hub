// frontend/src/components/grade/GradeForm.jsx
import { useState } from 'react'
import { isValidScore } from '../../utils/gradeUtils'

export default function GradeForm({
  groupId,
  score,
  comment,
  isPublished,
  canPublish,
  onScoreChange,
  onCommentChange,
  onPublish,
  onSaveDraft,
  onUnpublish,
  isLoading,
}) {
  const [localScore, setLocalScore] = useState(score || '')
  const [localComment, setLocalComment] = useState(comment || '')
  const [error, setError] = useState('')

  const handleScoreChange = (e) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLocalScore(value)
      onScoreChange(value)
      if (value && !isValidScore(value)) {
        setError('Score must be between 0 and 100')
      } else {
        setError('')
      }
    }
  }

  const handleCommentChange = (e) => {
    const value = e.target.value
    setLocalComment(value)
    onCommentChange(value)
  }

  const isScoreValid = !localScore || isValidScore(localScore)
  
  // hasChanges chỉ cần score hoặc comment khác rỗng
  const hasChanges = localScore !== '' || localComment !== ''

  return (
    <div className="grade-form">
      <div className="grade-form__fields">
        <div className="grade-form__field">
          <label htmlFor={`score-${groupId}`}>Score (0-100)</label>
          <input
            id={`score-${groupId}`}
            type="text"
            inputMode="decimal"
            value={localScore}
            onChange={handleScoreChange}
            disabled={isPublished}
            placeholder="Enter score"
            className={`grade-form__score-input ${error ? 'grade-form__score-input--error' : ''}`}
          />
          {error && <span className="grade-form__error">{error}</span>}
        </div>

        <div className="grade-form__field">
          <label htmlFor={`comment-${groupId}`}>Final Comment</label>
          <textarea
            id={`comment-${groupId}`}
            value={localComment}
            onChange={handleCommentChange}
            disabled={isPublished}
            // ❌ ĐÃ BỎ maxLength={2000}
            rows={3}
            className="grade-form__comment-input"
            placeholder="Enter your feedback for this group..."
          />
          <span className="grade-form__char-count">
            {localComment?.length || 0}/2000
          </span>
        </div>
      </div>

      <div className="grade-form__actions">
        {isPublished ? (
          <>
            <button 
              className="grade-form__btn grade-form__btn--danger"
              onClick={onUnpublish}
              disabled={isLoading}
            >
              {isLoading ? 'Unpublishing...' : 'Unpublish'}
            </button>
            <span className="grade-form__published-badge">
              ✅ Published
            </span>
          </>
        ) : (
          <>
            <button 
                className="grade-form__btn grade-form__btn--secondary"
                onClick={onSaveDraft}
                disabled={isLoading || !hasChanges}
            >
                {isLoading ? 'Saving...' : 'Save Draft'}
            </button>

            <button 
                className="grade-form__btn grade-form__btn--primary"
                onClick={onPublish}
                disabled={!canPublish || !isScoreValid || !localScore || isLoading}
            >
                {isLoading ? 'Publishing...' : 'Publish'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}