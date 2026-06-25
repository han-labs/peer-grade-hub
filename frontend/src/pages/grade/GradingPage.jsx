// frontend/src/pages/grade/GradingPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'  // ✅ Thêm useLocation vào import
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { getGradingData, publishGrades, saveDraft, unpublishGrade, toggleShowcase } from '../../api/gradeApi'
import { ApiError } from '../../api/httpClient'
import DashboardTopbar from '../../components/DashboardTopbar'
import LoadingScreen from '../../components/LoadingScreen'
import GradingStats from '../../components/grade/GradingStats'
import GroupGradeCard from '../../components/grade/GroupGradeCard'
import ShowcaseToggle from '../../components/grade/ShowcaseToggle'
import PublishConfirmationModal from '../../components/grade/PublishConfirmationModal'
import { Gauge } from 'lucide-react'
import '../../styles/grade.css'

export default function GradingPage() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()  // useLocation phải ở trong component
  const { user, token, logout } = useAuth()

  // Lấy courseId và lessonId từ location.state
  const { courseId, lessonId } = location.state || {}

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gradingData, setGradingData] = useState(null)

  // Grade entries: { groupId: { score, comment } }
  const [gradeEntries, setGradeEntries] = useState({})
  const [selectedGroups, setSelectedGroups] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showcaseEnabled, setShowcaseEnabled] = useState(false)

  // Publish confirmation
  const [confirmModal, setConfirmModal] = useState(null)

  // State cho lỗi - lưu theo groupId
  const [saveErrors, setSaveErrors] = useState({})
  const [publishError, setPublishError] = useState(null)

  // Hàm điều hướng back
  const handleBack = () => {
    if (courseId && lessonId) {
      navigate(`/lecturer/courses/${courseId}/lessons/${lessonId}/assignments`)
    } else {
      navigate('/dashboard')
    }
  }

  const fetchGradingData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getGradingData(assignmentId, token)
      const data = response.data
      setGradingData(data)
      setShowcaseEnabled(data.showcaseMode || false)

      // Initialize grade entries
      const entries = {}
      data.groups.forEach(group => {
        entries[group.groupId] = {
          score: group.currentFinalScore !== null && group.currentFinalScore !== undefined 
            ? String(group.currentFinalScore) 
            : '',
          comment: group.currentFinalComment || ''
        }
      })
      setGradeEntries(entries)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to load grading data')
    } finally {
      setLoading(false)
    }
  }, [assignmentId, token, logout, navigate])

  useEffect(() => {
    fetchGradingData()
  }, [fetchGradingData])

  const handleGradeChange = (groupId, field, value) => {
    setGradeEntries(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [field]: value
      }
    }))
  }

  const handleSelectGroup = (groupId, selected) => {
    setSelectedGroups(prev => 
      selected 
        ? [...prev, groupId]
        : prev.filter(id => id !== groupId)
    )
  }

  const handlePublishGroup = (groupId) => {
    const group = gradingData.groups.find(g => g.groupId === groupId)
    if (!group) return

    // Kiểm tra điểm trước khi publish
    const entry = gradeEntries[groupId]
    if (!entry?.score || parseFloat(entry.score) < 0 || parseFloat(entry.score) > 100) {
      alert(`Please enter a valid score (0-100) for ${group.groupName} before publishing.`)
      return
    }

    // Kiểm tra đã publish chưa
    if (group.isPublished) {
      alert(`${group.groupName} is already published.`)
      return
    }

    // If no peer review, show confirmation modal
    if (!group.hasPeerReview) {
      setConfirmModal({
        groupId,
        groupName: group.groupName,
        hasPeerReview: false,
      })
      return
    }

    // Direct publish
    executePublish([groupId])
  }

  const handlePublishSelected = () => {
    if (selectedGroups.length === 0) return

    // Kiểm tra điểm cho tất cả group được chọn
    const invalidGroups = selectedGroups.filter(groupId => {
      const entry = gradeEntries[groupId]
      const score = entry?.score
      return !score || parseFloat(score) < 0 || parseFloat(score) > 100
    })

    if (invalidGroups.length > 0) {
      const invalidNames = invalidGroups.map(id => {
        const group = gradingData.groups.find(g => g.groupId === id)
        return group?.groupName || `Group ${id}`
      })
      alert(`Cannot publish selected groups because they have invalid or missing scores:\n${invalidNames.join(', ')}`)
      return
    }

    // Kiểm tra group đã publish chưa
    const publishedGroups = selectedGroups.filter(groupId => {
      const group = gradingData.groups.find(g => g.groupId === groupId)
      return group?.isPublished
    })

    if (publishedGroups.length > 0) {
      const publishedNames = publishedGroups.map(id => {
        const group = gradingData.groups.find(g => g.groupId === id)
        return group?.groupName || `Group ${id}`
      })
      alert(`The following groups are already published:\n${publishedNames.join(', ')}`)
      return
    }

    // Check if any selected group has no peer review
    const groupsWithNoPeerReview = gradingData.groups.filter(
      g => selectedGroups.includes(g.groupId) && !g.hasPeerReview
    )

    if (groupsWithNoPeerReview.length > 0) {
      const group = groupsWithNoPeerReview[0]
      setConfirmModal({
        groupId: group.groupId,
        groupName: group.groupName,
        hasPeerReview: false,
        isBatch: true,
        allGroupIds: selectedGroups,
      })
      return
    }

    executePublish(selectedGroups)
  }

  const executePublish = async (groupIds) => {
    try {
        setIsSubmitting(true)
        setPublishError(null)
        
        // Lọc chỉ publish group có điểm
        const validGroupIds = groupIds.filter(groupId => {
            const entry = gradeEntries[groupId]
            return entry?.score && entry.score.trim() !== ''
        })
        
        if (validGroupIds.length === 0) {
            setPublishError('Please enter a valid score (0-100) for all selected groups before publishing.')
            setIsSubmitting(false)
            return
        }

        const grades = validGroupIds.map(groupId => ({
            groupId,
            score: parseFloat(gradeEntries[groupId]?.score) || 0,
            comment: gradeEntries[groupId]?.comment || ''
        }))

        const response = await publishGrades({
            assignmentId: parseInt(assignmentId),
            groupIds: validGroupIds,
            grades
        }, token)

        // Kiểm tra warning từ response (no peer review)
        const warnings = response.data?.publishedGroups
            ?.filter(g => g.warning)
            ?.map(g => g.warning) || []

        if (warnings.length > 0) {
            setPublishError(warnings.join('\n'))
            setTimeout(() => setPublishError(null), 8000)
        }

        setSelectedGroups(prev => prev.filter(id => !validGroupIds.includes(id)))
        await fetchGradingData()
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
            logout()
            navigate('/login', { replace: true })
            return
        }
        
        let errorMessage = err.message || 'Failed to publish grades'
        if (err.payload?.fieldErrors && err.payload.fieldErrors.length > 0) {
            errorMessage = err.payload.fieldErrors[0].message
        }
        
        setPublishError(errorMessage)
        setTimeout(() => setPublishError(null), 5000)
    } finally {
        setIsSubmitting(false)
        setConfirmModal(null)
    }
}

  const handleSaveDraft = async (groupId) => {
    try {
        setIsSubmitting(true)
        // Xóa lỗi của group này
        setSaveErrors(prev => ({ ...prev, [groupId]: null }))
        
        const entry = gradeEntries[groupId]
        
        // Nếu score rỗng → gửi null (không lưu điểm)
        const scoreValue = entry?.score?.trim() !== '' ? parseFloat(entry.score) : null
        
        await saveDraft({
            assignmentId: parseInt(assignmentId),
            groupId,
            score: scoreValue,  
            comment: entry?.comment || ''
        }, token)
        await fetchGradingData()
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
            logout()
            navigate('/login', { replace: true })
            return
        }
        
        let errorMessage = err.message || 'Failed to save draft'
        if (err.payload?.fieldErrors && err.payload.fieldErrors.length > 0) {
            errorMessage = err.payload.fieldErrors[0].message
        }
        
        // Lưu lỗi theo groupId
        setSaveErrors(prev => ({ ...prev, [groupId]: errorMessage }))
        setTimeout(() => {
            setSaveErrors(prev => ({ ...prev, [groupId]: null }))
        }, 5000)
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleUnpublish = async (groupId) => {
    try {
      setIsSubmitting(true)
      await unpublishGrade({
        assignmentId: parseInt(assignmentId),
        groupId
      }, token)
      await fetchGradingData()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to unpublish grade')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleShowcase = async (enabled) => {
    try {
      setIsSubmitting(true)
      await toggleShowcase({
        assignmentId: parseInt(assignmentId),
        enabled
      }, token)
      setShowcaseEnabled(enabled)
      await fetchGradingData()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to toggle showcase mode')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading grading data..." />
  }

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Gauge} label="Manage Final Grades" />
        <main className="grading-page">
          <button className="back-link" type="button" onClick={handleBack}>
            <ArrowLeft size={17} aria-hidden="true" />
            {courseId && lessonId ? 'Back to assignments' : 'Dashboard'}
          </button>
          <div className="error-state">
            <AlertCircle size={28} />
            <h2>Failed to load grading data</h2>
            <p>{error}</p>
            <button className="secondary-action" onClick={fetchGradingData}>
              <RefreshCw size={17} />
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!gradingData) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Gauge} label="Manage Final Grades" />
        <main className="grading-page">
          <button className="back-link" type="button" onClick={handleBack}>
            <ArrowLeft size={17} aria-hidden="true" />
            {courseId && lessonId ? 'Back to assignments' : 'Dashboard'}
          </button>
          <div className="empty-state">
            <h2>No grading data available</h2>
            <p>This assignment may not have any groups or submissions yet.</p>
          </div>
        </main>
      </div>
    )
  }

  const allGroups = gradingData.groups || []

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={Gauge} label="Manage Final Grades" />

      <main className="grading-page">
        <button className="back-link" type="button" onClick={handleBack}>
          <ArrowLeft size={17} aria-hidden="true" />
          {courseId && lessonId ? 'Back to assignments' : 'Dashboard'}
        </button>

        {/* Header */}
        <div className="grading-page__header">
          <p className="eyebrow">Grading · Assignment #{assignmentId}</p>
          <h1>{gradingData.assignmentTitle || 'Untitled Assignment'}</h1>
          <p className="grading-page__subtitle">
            Review submissions and peer reviews, then publish final grades for each group.
          </p>
          <div className="grading-page__deadlines">
            <span className="grading-page__deadlines-item">
              Submission deadline: <strong>{gradingData.submissionDeadline || '—'}</strong>
            </span>
            <span className="grading-page__deadlines-item">
              Review deadline: <strong>{gradingData.reviewDeadline || '—'}</strong>
            </span>
          </div>
        </div>

        {/* Stats */}
        <GradingStats stats={gradingData} />

        {/* Showcase Toggle */}
        <ShowcaseToggle
          enabled={showcaseEnabled}
          onToggle={handleToggleShowcase}
          isLoading={isSubmitting}
        />

        {/* Group Cards */}
        <div className="grading-page__groups">
          {allGroups.map(group => (
            <GroupGradeCard
              key={group.groupId}
              group={group}
              gradeEntry={gradeEntries[group.groupId] || {}}
              selected={selectedGroups.includes(group.groupId)}
              onSelect={(selected) => handleSelectGroup(group.groupId, selected)}
              onGradeChange={handleGradeChange}
              onPublish={() => handlePublishGroup(group.groupId)}
              onSaveDraft={() => handleSaveDraft(group.groupId)}
              onUnpublish={() => handleUnpublish(group.groupId)}
              isSubmitting={isSubmitting}
              saveError={saveErrors[group.groupId]}
            />
          ))}
        </div>

        {/* Batch Actions */}
        <div className="grading-page__batch-actions">
          {publishError && (
            <div className={`grading-page__${publishError.includes('peer review') ? 'warning' : 'error'}`}>
              <AlertCircle size={16} />
              <span style={{ whiteSpace: 'pre-line' }}>{publishError}</span>
            </div>
          )}
          <button
            className="primary-button"
            onClick={handlePublishSelected}
            disabled={selectedGroups.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : `Publish Selected (${selectedGroups.length})`}
          </button>
        </div>

        {/* Publish Confirmation Modal */}
        {confirmModal && (
          <PublishConfirmationModal
            isOpen={true}
            groupName={confirmModal.groupName}
            hasPeerReview={confirmModal.hasPeerReview}
            onConfirm={() => {
              if (confirmModal.isBatch) {
                executePublish(confirmModal.allGroupIds)
              } else {
                executePublish([confirmModal.groupId])
              }
            }}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </main>
    </div>
  )
}