// frontend/src/components/grade/EvidencePanel.jsx
import { useState } from 'react'
import { FileText, Link2, ChevronDown, ChevronRight } from 'lucide-react'
import PeerReviewEvidence from './PeerReviewEvidence'
import { useAuth } from '../../auth/useAuth'
import { downloadSubmissionFile } from '../../api/studentSubmissionApi'

/**
 * Display submission evidence and peer reviews for a group
 */
export default function EvidencePanel({ 
  hasSubmission, 
  submittedAt,
  submitterName,
  submissionNote,
  attachments,
  hasPeerReview, 
  peerReviews,
  isPublished,
  isStudentView = false 
}) {
  const { token } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const submissionData = {
    submittedAt,
    submitterName,
    submissionNote,
    attachments
  }

  const hasEvidence = hasSubmission || hasPeerReview

  if (!hasEvidence) {
    return (
      <div className="evidence-panel evidence-panel--empty">
        <p className="evidence-panel__empty-text">No submission or peer review available.</p>
      </div>
    )
  }

  const handleDownload = async (attachment) => {
    // Nếu là LINK, mở tab mới
    if (attachment.attachmentType === 'LINK') {
      const url = attachment.url;
      if (url) window.open(url, '_blank');
      return;
    }

    // Nếu là FILE, download qua API
    if (attachment.attachmentType === 'FILE' && attachment.downloadUrl) {
      try {
        setDownloading(true)
        const { blob, fileName } = await downloadSubmissionFile(attachment.downloadUrl, token)
        
        // Tạo link tải file
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download failed:', error)
        alert(error.message || 'File is not available for download.')
      } finally {
        setDownloading(false)
      }
    }
  }

  return (
    <div className="evidence-panel">
      <button 
        className="evidence-panel__toggle"
        onClick={() => setExpanded(!expanded)}
        type="button"
        disabled={downloading}
      >
        <span className="evidence-panel__toggle-label">
          {downloading ? 'Downloading...' : (expanded ? 'Hide' : 'Show')} evidence
        </span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {expanded && (
        <div className="evidence-panel__body">
          {/* Submission */}
          {hasSubmission && submissionData && (
            <div className="evidence-panel__section">
              <div className="evidence-panel__section-header">
                <h4>Submission</h4>
                {submissionData.submittedAt && (
                  <span className="evidence-panel__section-date">
                    {new Date(submissionData.submittedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {submissionData.submitterName && (
                <p className="evidence-panel__submitter">
                  Submitted by: <strong>{submissionData.submitterName}</strong>
                </p>
              )}
              {submissionData.submissionNote && (
                <p className="evidence-panel__note">{submissionData.submissionNote}</p>
              )}
              {submissionData.attachments && submissionData.attachments.length > 0 && (
                <div className="evidence-panel__attachments">
                  {submissionData.attachments.map((att, i) => {
                    const isLink = att.attachmentType === 'LINK'
                    return (
                      <button
                        className="evidence-panel__attachment"
                        key={i}
                        onClick={() => handleDownload(att)}
                        disabled={downloading}
                        title={isLink ? 'Open link' : `Download ${att.fileName || att.title}`}
                      >
                        {isLink ? <Link2 size={14} /> : <FileText size={14} />}
                        {att.title || att.fileName || att.url || 'Attachment'}
                        {att.fileSizeMb && (
                          <span className="evidence-panel__attachment-size">
                            ({att.fileSizeMb} MB)
                          </span>
                        )}
                      </button>
                    )
                  })}
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