// frontend/src/pages/LessonAssignmentsPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  ClipboardList, 
  CalendarClock, 
  ChevronRight,
  BookOpen,
  Clock,
  FileText
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { getLessonAssignments } from '../api/lessonApi'
import { ApiError } from '../api/httpClient'
import DashboardTopbar from '../components/DashboardTopbar'
import LoadingScreen from '../components/LoadingScreen'

export default function LessonAssignmentsPage() {
  const { courseId, lessonId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  
  const [data, setData] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAssignments()
  }, [lessonId])

  const fetchAssignments = async () => {
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
  }

  const handleSelectAssignment = (assignmentId) => {
    navigate(`/lecturer/assignments/${assignmentId}/grading`,{
      state: { 
        courseId: parseInt(courseId), 
        lessonId: parseInt(lessonId) 
      }
    })
  }

  if (loading) return <LoadingScreen label="Loading assignments..." />

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={ClipboardList} label="Assignments" />
        <main className="assignments-page">
          <button className="back-link" type="button" onClick={() => navigate(`/lecturer/courses/${courseId}/lessons`)}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back to lessons
          </button>
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" onClick={fetchAssignments}>Retry</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={FileText} label="Lesson Assignments" />

      <main className="lesson-assignments-page">
        <button className="back-link" type="button" onClick={() => navigate(`/lecturer/courses/${courseId}/lessons`)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to lessons
        </button>

        <div className="lesson-assignments-page__header">
          <div className="lesson-assignments-page__breadcrumb">
            <span>{data?.courseName || 'Course'}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{data?.lessonTitle || 'Lesson'}</span>
          </div>
          <div className="lesson-assignments-page__title-section">
            <h1>Assignments</h1>
            <p className="lesson-assignments-page__subtitle">
              Select an assignment to review submissions and manage final grades.
            </p>
          </div>
          <div className="lesson-assignments-page__stats">
            <span className="stat-chip">
              <ClipboardList size={16} />
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>
        </div>

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
              <div 
                className="assignment-card" 
                key={assignment.id}
                onClick={() => handleSelectAssignment(assignment.id)}
              >
                <div className="assignment-card__header">
                  <div className="assignment-card__icon">
                    <ClipboardList size={20} />
                  </div>
                  <div className="assignment-card__badge">
                    <span className="status-badge status-badge--active">
                      {assignment.showcaseMode ? 'Showcase ON' : 'Showcase OFF'}
                    </span>
                  </div>
                </div>
                <div className="assignment-card__body">
                  <h3 className="assignment-card__title">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="assignment-card__description">
                      {assignment.description}
                    </p>
                  )}
                  <div className="assignment-card__meta">
                    <div className="assignment-card__meta-item">
                      <CalendarClock size={15} />
                      <span>
                        Submission: {assignment.submissionDeadline 
                          ? new Date(assignment.submissionDeadline).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>
                    <div className="assignment-card__meta-item">
                      <Clock size={15} />
                      <span>
                        Review: {assignment.reviewDeadline 
                          ? new Date(assignment.reviewDeadline).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="assignment-card__action">
                  <button className="assignment-card__btn" type="button">
                    Grade Assignment
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}