// frontend/src/pages/LessonAssignmentsPage.jsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  Gauge,
  ClipboardList
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { getLessonAssignments } from '../api/lessonApi'
import { deleteAssignment } from '../api/assignmentApi'
import { ApiError } from '../api/httpClient'
import DashboardTopbar from '../components/DashboardTopbar'
import LoadingScreen from '../components/LoadingScreen'
import AssignmentForm from '../components/assignment/AssignmentForm'
import AssignmentCard from '../components/assignment/AssignmentCard'

export default function LessonAssignmentsPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  
  const [data, setData] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form Panel State
  const [showFormPanel, setShowFormPanel] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getLessonAssignments(lessonId, token)
      setData(response.data)
      setAssignments(response.data.assignments || [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [lessonId, logout, navigate, token])

  useEffect(() => {
    const timer = window.setTimeout(fetchAssignments, 0)
    return () => window.clearTimeout(timer)
  }, [fetchAssignments])

  const handleSelectAssignment = (assignmentId) => {
    navigate(`/lecturer/assignments/${assignmentId}/grading`, {
      state: { 
        courseId: parseInt(courseId), 
        lessonId: parseInt(lessonId) 
      }
    })
  }

  const handleOpenCreateForm = () => {
    setIsEditing(false)
    setEditingAssignment(null)
    setSuccessMessage('')
    setError('')
    setShowFormPanel(true)
  }

  const handleOpenEditForm = (assignment) => {
    setIsEditing(true)
    setEditingAssignment(assignment)
    setSuccessMessage('')
    setError('')
    setShowFormPanel(true)
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return
    }
    
    try {
      setLoading(true)
      await deleteAssignment(assignmentId, token)
      setSuccessMessage('Assignment deleted successfully.')
      await fetchAssignments()
    } catch (err) {
      setError(err.message || 'Failed to delete assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSuccess = (message) => {
    setSuccessMessage(message)
    setShowFormPanel(false)
    fetchAssignments()
  }

  if (loading && !showFormPanel) return <LoadingScreen label="Loading assignments..." />

  if (error && !showFormPanel) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Gauge} label="Manage Final Grades" />
        <main className="lesson-assignments-page">
          <button
            className="back-link"
            type="button"
            onClick={() => navigate(`/lecturer/courses/${courseId}/lessons`)}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to lessons
          </button>
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" onClick={fetchAssignments}>
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={Gauge} label="Manage Final Grades" />

      <main className="lesson-assignments-page">
        <button className="back-link" type="button" onClick={() => navigate(`/lecturer/courses/${courseId}/lessons`)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to lessons
        </button>

        <div className="lesson-assignments-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="lesson-assignments-page__breadcrumb">
              <span>{data?.courseName || 'Course'}</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{data?.lessonTitle || 'Lesson'}</span>
            </div>
            <div className="lesson-assignments-page__title-section">
              <h1>Assignments</h1>
              <p className="lesson-assignments-page__subtitle">
                Select an assignment to grade.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="stat-chip">
              <ClipboardList size={16} />
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </span>
            {!showFormPanel && (
              <button className="primary-button" onClick={handleOpenCreateForm}>
                <Plus size={16} /> New Assignment
              </button>
            )}
          </div>
        </div>

        {successMessage && !showFormPanel && (
          <div className="form-alert" style={{ marginBottom: '24px', background: 'var(--positive-bg)', color: 'var(--positive-text)', border: '1px solid #c3e6cb' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {showFormPanel && (
          <AssignmentForm
            lessonId={lessonId}
            assignment={editingAssignment}
            token={token}
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => setShowFormPanel(false)}
          />
        )}

        {assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <FileText size={40} />
            </div>
            <h3>No assignments found</h3>
            <p>This lesson does not have any assignments yet.</p>
          </div>
        ) : (
          <div className="assignment-grid">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onSelect={handleSelectAssignment}
                onEdit={handleOpenEditForm}
                onDelete={handleDeleteAssignment}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
