import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Link as LinkIcon,
  File,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createAssignment, updateAssignment } from '../../api/assignmentApi'

// Constants for validation
const MAX_FILE_SIZE_MB = 20.0
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg"
]

const formatDatetimeForInput = (dtStr) => {
  if (!dtStr) return ''
  const date = new Date(dtStr)
  if (isNaN(date.getTime())) return ''
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AssignmentForm({ lessonId, assignment, token, onSaveSuccess, onCancel }) {
  const isEditing = !!assignment
  const editingAssignmentId = assignment?.id || null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submissionDeadline, setSubmissionDeadline] = useState('')
  const [reviewDeadline, setReviewDeadline] = useState('')
  const [appealDays, setAppealDays] = useState('7')
  const [materials, setMaterials] = useState([])
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Sub-Form for Material adding State
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [matTitle, setMatTitle] = useState('')
  const [matType, setMatType] = useState('FILE')
  const [matFileName, setMatFileName] = useState('')
  const [matFilePath, setMatFilePath] = useState('')
  const [matFileSize, setMatFileSize] = useState('')
  const [matFileType, setMatFileType] = useState('')
  const [matUrl, setMatUrl] = useState('')
  const [matLabel, setMatLabel] = useState('')
  const [materialFormError, setMaterialFormError] = useState('')

  // Initialize form fields when assignment changes or on mount
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '')
      setDescription(assignment.description || '')
      setSubmissionDeadline(formatDatetimeForInput(assignment.submissionDeadline))
      setReviewDeadline(formatDatetimeForInput(assignment.reviewDeadline))
      setAppealDays(assignment.appealDays !== undefined && assignment.appealDays !== null ? String(assignment.appealDays) : '7')
      setMaterials(assignment.materials || [])
    } else {
      setTitle('')
      setDescription('')
      setSubmissionDeadline('')
      setReviewDeadline('')
      setAppealDays('7')
      setMaterials([])
    }
    setFormError('')
  }, [assignment])

  const handleAddMaterial = (e) => {
    e.preventDefault()
    setMaterialFormError('')

    if (!matTitle.trim()) {
      setMaterialFormError('Material Title is required.')
      return
    }

    let newMaterial = {
      title: matTitle,
      materialType: matType
    }

    if (matType === 'FILE') {
      if (!matFileName.trim() || !matFilePath.trim() || !matFileSize.trim() || !matFileType.trim()) {
        setMaterialFormError('All file material fields (File Name, File Path, File Size MB, File Type) are required.')
        return
      }
      const sizeMb = parseFloat(matFileSize)
      if (isNaN(sizeMb) || sizeMb <= 0) {
        setMaterialFormError('File size must be a positive number.')
        return
      }
      if (sizeMb > MAX_FILE_SIZE_MB || !ALLOWED_FILE_TYPES.includes(matFileType)) {
        setMaterialFormError('File upload failed. Please check the file size and format, then try again. If the problem persists, contact the administrator.')
        return
      }

      newMaterial.fileName = matFileName
      newMaterial.filePath = matFilePath
      newMaterial.fileSizeMb = sizeMb
      newMaterial.fileType = matFileType
    } else {
      if (!matUrl.trim()) {
        setMaterialFormError('URL is required for links.')
        return
      }
      newMaterial.url = matUrl
      newMaterial.label = matLabel
    }

    setMaterials([...materials, newMaterial])
    
    // Clear material sub-form
    setMatTitle('')
    setMatFileName('')
    setMatFilePath('')
    setMatFileSize('')
    setMatFileType('')
    setMatUrl('')
    setMatLabel('')
    setShowMaterialForm(false)
  }

  const handleRemoveMaterial = (indexToRemove) => {
    setMaterials(materials.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSaveAssignment = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!title.trim()) {
      setFormError('Assignment title is required. Please enter a title before saving.')
      return
    }

    if (!submissionDeadline || !reviewDeadline) {
      setFormError('Cannot save assignment due to invalid data. Please review the assignment information and try again.')
      return
    }

    const subDate = new Date(submissionDeadline)
    const revDate = new Date(reviewDeadline)

    if (revDate <= subDate) {
      setFormError('Peer review deadline must be after submission deadline. Please adjust the deadlines.')
      return
    }

    const appealVal = appealDays.trim() === '' ? 7 : parseInt(appealDays)
    if (isNaN(appealVal) || appealVal < 0) {
      setFormError('Cannot save assignment due to invalid data. Please review the assignment information and try again.')
      return
    }

    const payload = {
      title,
      description: description || null,
      submissionDeadline,
      reviewDeadline,
      appealDays: appealVal,
      materials
    }

    setFormLoading(true)
    try {
      let savedAssignment
      if (isEditing) {
        const resp = await updateAssignment(editingAssignmentId, payload, token)
        savedAssignment = resp?.data ?? resp
        onSaveSuccess('Assignment updated successfully.', savedAssignment)
      } else {
        const resp = await createAssignment(lessonId, payload, token)
        savedAssignment = resp?.data ?? resp
        onSaveSuccess('Assignment created successfully.', savedAssignment)
      }
    } catch (err) {
      setFormError(err.message || 'Cannot save assignment due to invalid data. Please review the assignment information and try again.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="create-course-panel" style={{ padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
      <div className="section-heading" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isEditing ? 'Edit Assignment' : 'Create Assignment'}</h2>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSaveAssignment}>
        {formError && (
          <div className="form-alert" style={{ marginBottom: '16px' }}>
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
          <label className="form-field" style={{ gridColumn: 'span 2' }}>
            Assignment Title *
            <input
              type="text"
              placeholder="e.g. Lab 1: Object-Oriented Design Principles"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={formLoading}
              required
            />
          </label>

          <label className="form-field" style={{ gridColumn: 'span 2' }}>
            Description
            <textarea
              rows={4}
              placeholder="Provide details about the assignment requirements..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={formLoading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', resize: 'vertical' }}
            />
          </label>

          <label className="form-field">
            Submission Deadline *
            <input
              type="datetime-local"
              value={submissionDeadline}
              onChange={e => setSubmissionDeadline(e.target.value)}
              disabled={formLoading}
              required
            />
          </label>

          <label className="form-field">
            Peer Review Deadline *
            <input
              type="datetime-local"
              value={reviewDeadline}
              onChange={e => setReviewDeadline(e.target.value)}
              disabled={formLoading}
              required
            />
          </label>

          <label className="form-field">
            Appeal Period (days)
            <input
              type="number"
              min="0"
              placeholder="Defaults to 7 days if empty"
              value={appealDays}
              onChange={e => setAppealDays(e.target.value)}
              disabled={formLoading}
            />
          </label>
        </div>

        {/* Guidelines / Requirements section */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Guidelines &amp; Requirements ({materials.length})</h3>
            {!showMaterialForm && (
              <button type="button" className="secondary-action" onClick={() => setShowMaterialForm(true)} disabled={formLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> Add Guideline/File
              </button>
            )}
          </div>

          {showMaterialForm && (
            <div style={{ background: 'var(--page-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4>Add Guideline</h4>
                <button type="button" onClick={() => setShowMaterialForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={16} />
                </button>
              </div>

              {materialFormError && (
                <div className="form-alert" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={16} />
                  <span>{materialFormError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                <label className="form-field" style={{ gridColumn: 'span 2' }}>
                  Guideline Title *
                  <input type="text" placeholder="e.g. Grading Rubric / Requirements PDF" value={matTitle} onChange={e => setMatTitle(e.target.value)} />
                </label>

                <label className="form-field">
                  Type
                  <select value={matType} onChange={e => setMatType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <option value="FILE">FILE</option>
                    <option value="LINK">LINK</option>
                  </select>
                </label>

                {matType === 'LINK' ? (
                  <>
                    <label className="form-field">
                      URL *
                      <input type="text" placeholder="https://example.com/rubric" value={matUrl} onChange={e => setMatUrl(e.target.value)} />
                    </label>
                    <label className="form-field" style={{ gridColumn: 'span 2' }}>
                      Label
                      <input type="text" placeholder="e.g. View on Google Drive" value={matLabel} onChange={e => setMatLabel(e.target.value)} />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="form-field">
                      File Name *
                      <input type="text" placeholder="rubric.pdf" value={matFileName} onChange={e => setMatFileName(e.target.value)} />
                    </label>
                    <label className="form-field" style={{ gridColumn: 'span 2' }}>
                      File Path *
                      <input type="text" placeholder="/storage/oose/rubric.pdf" value={matFilePath} onChange={e => setMatFilePath(e.target.value)} />
                    </label>
                    <label className="form-field">
                      File Size (MB) *
                      <input type="number" step="0.01" placeholder="2.5" value={matFileSize} onChange={e => setMatFileSize(e.target.value)} />
                    </label>
                    <label className="form-field">
                      File Type *
                      <input type="text" placeholder="application/pdf" value={matFileType} onChange={e => setMatFileType(e.target.value)} />
                    </label>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="primary-button" onClick={handleAddMaterial} style={{ maxWidth: '160px' }}>
                  Confirm Material
                </button>
                <button type="button" className="logout-button" onClick={() => setShowMaterialForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {materials.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No guidelines or requirement files attached.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {materials.map((mat, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--page-bg)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {mat.materialType === 'LINK' ? <LinkIcon size={16} style={{ color: 'var(--blue)' }} /> : <File size={16} style={{ color: 'var(--purple)' }} />}
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{mat.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                        {mat.materialType === 'LINK' ? mat.url : `${mat.fileName} (${mat.fileSizeMb}MB)`}
                      </span>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveMaterial(index)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '30px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <button type="submit" className="primary-button" style={{ maxWidth: '200px' }} disabled={formLoading}>
            {formLoading ? <Loader2 size={18} className="button-spinner" /> : 'Save Assignment'}
          </button>
          <button type="button" className="logout-button" onClick={onCancel} disabled={formLoading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
