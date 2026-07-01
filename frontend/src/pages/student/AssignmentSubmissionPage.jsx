import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { ApiError } from '../../api/httpClient.js'
import {
  downloadSubmissionFile,
  getSubmissionPage,
  submitAssignment,
  uploadSubmissionFiles,
} from '../../api/studentSubmissionApi.js'
import { useAuth } from '../../auth/useAuth.js'
import DashboardTopbar from '../../components/DashboardTopbar.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'

const DEADLINE_PASSED_MESSAGE = 'Submission deadline has passed. You can no longer submit this assignment.'

function formatDateTime(value) {
  if (!value) return 'No deadline set'
  return new Date(value).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fileExtension(fileName) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

function toFileMetadata(file) {
  const fileSizeMb = Math.max(0.01, Number((file.size / (1024 * 1024)).toFixed(2)))
  return {
    file,
    title: file.name,
    fileName: file.name,
    filePath: '',
    fileSizeMb,
    fileType: fileExtension(file.name),
    label: 'File',
  }
}

function normalizeLinkRows(attachments = []) {
  const links = attachments
    .filter((attachment) => attachment.attachmentType === 'LINK')
    .map((attachment) => ({
      title: attachment.title || '',
      url: attachment.url || '',
      label: attachment.label || '',
    }))

  return links.length ? links : [{ title: '', url: '', label: '' }]
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

function AttachmentList({ attachments, onError, token }) {
  if (!attachments?.length) {
    return <p className="submission-muted">No attachments submitted yet.</p>
  }

  return (
    <div className="submission-attachment-list">
      {attachments.map((attachment, index) => {
        const key = attachment.attachmentId ?? `${attachment.attachmentType}-${index}`

        if (attachment.attachmentType === 'LINK') {
          const openUrl = attachment.openUrl || attachment.url
          return (
            <a
              className="submission-attachment-item"
              href={openUrl}
              key={key}
              rel="noreferrer"
              target="_blank"
            >
              <span className="submission-attachment-item__icon">
                <ExternalLink size={17} />
              </span>
              <span>
                <strong>{attachment.title || openUrl}</strong>
                <small>{attachment.label || openUrl}</small>
              </span>
            </a>
          )
        }

        const fileMeta = `${(attachment.fileType || 'file').toUpperCase()} / ${attachment.fileSizeMb ?? 0} MB${
          attachment.label ? ` / ${attachment.label}` : ''
        }`

        return (
          <a
            className="submission-attachment-item"
            href={attachment.downloadUrl || undefined}
            key={key}
            onClick={async (event) => {
              event.preventDefault()
              if (!attachment.downloadUrl) return
              try {
                const { blob, fileName } = await downloadSubmissionFile(attachment.downloadUrl, token)
                triggerBlobDownload(blob, fileName)
              } catch (err) {
                onError?.(err.message || 'File is not available for download.')
              }
            }}
          >
            <span className="submission-attachment-item__icon">
              <FileText size={17} />
            </span>
            <span>
              <strong>{attachment.fileName || attachment.title}</strong>
              <small>{attachment.downloadUrl ? `Download file / ${fileMeta}` : fileMeta}</small>
            </span>
          </a>
        )
      })}
    </div>
  )
}

function getSubmissionDetailUrl(submission, pageData) {
  if (!submission?.submissionId) return null
  return submission.studentSubmissionUrl
    || `/student/courses/${pageData?.courseId}/assignments/${submission.assignmentId}/submissions/${submission.submissionId}`
}

export default function AssignmentSubmissionPage() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [pageData, setPageData] = useState(null)
  const [note, setNote] = useState('')
  const [links, setLinks] = useState([{ title: '', url: '', label: '' }])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadSubmissionPage = useCallback(() => {
    setError('')
    return getSubmissionPage(assignmentId, token)
      .then((response) => {
        const data = response.data
        const currentSubmission = data?.currentSubmission
        setPageData(data)
        setNote(currentSubmission?.note || '')
        setLinks(normalizeLinkRows(currentSubmission?.attachments))
        setFiles([])
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || 'Submission page could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [assignmentId, token, logout, navigate])

  useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
      if (!mounted) return
      setLoading(true)

      getSubmissionPage(assignmentId, token)
        .then((response) => {
          if (!mounted) return
          const data = response.data
          const currentSubmission = data?.currentSubmission
          setPageData(data)
          setNote(currentSubmission?.note || '')
          setLinks(normalizeLinkRows(currentSubmission?.attachments))
          setFiles([])
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            logout()
            navigate('/login', { replace: true })
            return
          }
          if (mounted) setError(err.message || 'Submission page could not be loaded.')
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    }, 0)

    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [assignmentId, token, logout, navigate])

  const updateLink = (index, field, value) => {
    setLinks((current) => current.map((link, linkIndex) => (
      linkIndex === index ? { ...link, [field]: value } : link
    )))
  }

  const removeLink = (index) => {
    setLinks((current) => {
      const nextLinks = current.filter((_, linkIndex) => linkIndex !== index)
      return nextLinks.length ? nextLinks : [{ title: '', url: '', label: '' }]
    })
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []).map(toFileMetadata)
    setFiles((current) => [...current, ...selectedFiles])
    event.target.value = ''
  }

  const updateFile = (index, field, value) => {
    setFiles((current) => current.map((file, fileIndex) => (
      fileIndex === index ? { ...file, [field]: value } : file
    )))
  }

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    const payload = {
      note,
      links: links
        .map((link) => ({
          title: link.title.trim(),
          url: link.url.trim(),
          label: link.label.trim(),
        }))
        .filter((link) => link.title || link.url || link.label),
    }

    submitAssignment(assignmentId, payload, token)
      .then((response) => {
        if (files.length) {
          return uploadSubmissionFiles(assignmentId, files, token)
        }
        return response
      })
      .then((response) => {
        setNotice(response?.data?.message || response?.message || 'Assignment submitted successfully.')
        return loadSubmissionPage()
      })
      .catch((err) => setError(err.message || 'Assignment could not be submitted.'))
      .finally(() => setSubmitting(false))
  }

  if (loading) return <LoadingScreen label="Loading submission page..." />

  const deadlinePassed = Boolean(pageData?.deadlinePassed)
  const submitDisabled = submitting || deadlinePassed || Boolean(error && !pageData)

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={FileText} label="Submit Assignment" />

      <main className="dashboard-main assignment-submission-page">
        <button className="back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
          Back
        </button>

        {error && !pageData ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadSubmissionPage}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <section className="student-participation-header assignment-submission-hero">
              <p className="eyebrow">Assignment submission</p>
              <h1>{pageData?.assignmentTitle || 'Submit Assignment'}</h1>
              <p>{pageData?.description || 'Prepare your group assignment links and file metadata.'}</p>
              <div className="submission-meta-row">
                <span className="stat-chip">
                  <ClipboardList size={16} />
                  {pageData?.courseName || 'Course'}
                </span>
                <span className="stat-chip">
                  <FileText size={16} />
                  {pageData?.groupName || 'Group'}
                </span>
              </div>
            </section>

            <section className={`deadline-card ${pageData?.warningRed ? 'deadline-card--warning' : ''}`}>
              <div>
                <p className="eyebrow">Submission deadline</p>
                <h2>{formatDateTime(pageData?.submissionDeadline)}</h2>
                {deadlinePassed ? (
                  <p>{DEADLINE_PASSED_MESSAGE}</p>
                ) : (
                  <p>
                    {pageData?.hoursRemaining ?? 0} hours remaining
                    {pageData?.warningRed ? ' / Deadline soon' : ''}
                  </p>
                )}
              </div>
              <span className={`status-badge ${deadlinePassed ? 'status-badge--archived' : 'status-badge--active'}`}>
                {deadlinePassed ? 'CLOSED' : 'OPEN'}
              </span>
            </section>

            {error && (
              <div className="error-state submission-inline-error">
                <p>{error}</p>
              </div>
            )}

            {notice && <p className="success-message">{notice}</p>}

            <div className="assignment-submission-layout">
              <form className="submission-form" onSubmit={handleSubmit}>
                <section className="submission-panel">
                  <div className="submission-panel__header">
                    <div>
                      <p className="eyebrow">Submission note</p>
                      <h2>Group note</h2>
                    </div>
                  </div>
                  <label className="submission-field">
                    <span>Note</span>
                    <textarea
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Add a short note for your lecturer."
                      rows={5}
                      value={note}
                    />
                  </label>
                </section>

                <section className="submission-panel">
                  <div className="submission-panel__header">
                    <div>
                      <p className="eyebrow">Links</p>
                      <h2>External links</h2>
                    </div>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => setLinks((current) => [...current, { title: '', url: '', label: '' }])}
                    >
                      <Plus size={16} />
                      Add link
                    </button>
                  </div>

                  <div className="submission-row-list">
                    {links.map((link, index) => (
                      <div className="submission-link-row" key={`link-${index}`}>
                        <label className="submission-field">
                          <span>Title</span>
                          <input
                            onChange={(event) => updateLink(index, 'title', event.target.value)}
                            placeholder="GitHub Repository"
                            value={link.title}
                          />
                        </label>
                        <label className="submission-field">
                          <span>URL</span>
                          <input
                            onChange={(event) => updateLink(index, 'url', event.target.value)}
                            placeholder="https://..."
                            value={link.url}
                          />
                        </label>
                        <label className="submission-field">
                          <span>Label</span>
                          <input
                            onChange={(event) => updateLink(index, 'label', event.target.value)}
                            placeholder="Source code"
                            value={link.label}
                          />
                        </label>
                        <button
                          aria-label="Remove link"
                          className="icon-button submission-remove-button"
                          type="button"
                          onClick={() => removeLink(index)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="submission-panel">
                  <div className="submission-panel__header">
                    <div>
                      <p className="eyebrow">Files</p>
                      <h2>File metadata</h2>
                      <p>Selected files will be uploaded to protected backend storage.</p>
                    </div>
                    <label className="secondary-action submission-file-picker">
                      <Upload size={16} />
                      Select files
                      <input multiple onChange={handleFileSelect} type="file" />
                    </label>
                  </div>

                  {files.length ? (
                    <div className="submission-file-list">
                      {files.map((file, index) => (
                        <div className="submission-file-row" key={`${file.fileName}-${index}`}>
                          <div>
                            <strong>{file.fileName}</strong>
                            <small>{file.fileType || 'file'} / {file.fileSizeMb} MB</small>
                          </div>
                          <label className="submission-field">
                            <span>Label</span>
                            <input
                              onChange={(event) => updateFile(index, 'label', event.target.value)}
                              value={file.label}
                            />
                          </label>
                          <button
                            aria-label="Remove file metadata"
                            className="icon-button submission-remove-button"
                            type="button"
                            onClick={() => removeFile(index)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="submission-muted">No files selected.</p>
                  )}
                </section>

                <div className="submission-submit-row">
                  {deadlinePassed && <p>{DEADLINE_PASSED_MESSAGE}</p>}
                  <button className="compact-primary-action" disabled={submitDisabled} type="submit">
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>

              <aside className="submission-panel current-submission-panel">
                <div className="submission-panel__header">
                  <div>
                    <p className="eyebrow">Current submission</p>
                    <h2>{pageData?.currentSubmission ? 'Submitted work' : 'No submission yet'}</h2>
                  </div>
                  {pageData?.currentSubmission?.status && (
                    <span className="status-badge status-badge--active">
                      {pageData.currentSubmission.status}
                    </span>
                  )}
                </div>

                {pageData?.currentSubmission ? (
                  <div className="current-submission-detail">
                    {getSubmissionDetailUrl(pageData.currentSubmission, pageData) && (
                      <div className="current-submission-detail-link">
                        <span>Submission detail link</span>
                        <a href={getSubmissionDetailUrl(pageData.currentSubmission, pageData)}>
                          View this submission
                        </a>
                      </div>
                    )}
                    <dl>
                      <div>
                        <dt>Submitted by</dt>
                        <dd>{pageData.currentSubmission.submittedByName || '-'}</dd>
                      </div>
                      <div>
                        <dt>Submitted at</dt>
                        <dd>{formatDateTime(pageData.currentSubmission.submittedAt)}</dd>
                      </div>
                    </dl>
                    {pageData.currentSubmission.note && (
                      <p className="current-submission-note">{pageData.currentSubmission.note}</p>
                    )}
                    <AttachmentList
                      attachments={pageData.currentSubmission.attachments}
                      onError={setError}
                      token={token}
                    />
                  </div>
                ) : (
                  <p className="submission-muted">Your group has not submitted this assignment yet.</p>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
