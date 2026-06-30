// frontend/src/components/result/ShowcaseSubmissionCard.jsx
import { FileText, Link2, Calendar, User, Eye, EyeOff, Download } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { downloadSubmissionFile } from '../../api/studentSubmissionApi';
import PeerFeedbackList from './PeerFeedbackList';

/**
 * Trigger download file từ blob
 */
function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

/**
 * One group's submission in the Class Gallery
 * BR-15: Only shows final score if the group's grade is published
 */
export default function ShowcaseSubmissionCard({ submission, isCurrentGroup }) {
  const { token } = useAuth();
  
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

  /**
   * Xử lý click download file
   */
  const handleDownload = async (attachment) => {
    // Nếu là LINK, mở tab mới
    if (attachment.attachmentType === 'LINK') {
      const url = attachment.openUrl || attachment.url;
      if (url) window.open(url, '_blank');
      return;
    }

    // Nếu là FILE, download qua API
    if (attachment.attachmentType === 'FILE' && attachment.downloadUrl) {
      try {
        const { blob, fileName } = await downloadSubmissionFile(attachment.downloadUrl, token);
        triggerBlobDownload(blob, fileName);
      } catch (error) {
        console.error('Download failed:', error);
        alert(error.message || 'File is not available for download.');
      }
    }
  };

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
              const key = att.attachmentId || index;

              return (
                <button
                  key={key}
                  className="showcase-submission-card__attachment"
                  onClick={() => handleDownload(att)}
                  title={isLink ? 'Open link' : `Download ${att.fileName || att.title}`}
                >
                  {isLink ? <Link2 size={12} /> : <FileText size={12} />}
                  {att.title || att.fileName || att.url || 'Attachment'}
                  {att.fileSizeMb && (
                    <span className="showcase-submission-card__attachment-size">
                      ({att.fileSizeMb} MB)
                    </span>
                  )}
                  {!isLink && <Download size={12} />}
                </button>
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