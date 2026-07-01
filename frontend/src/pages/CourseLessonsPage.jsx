// frontend/src/pages/CourseLessonsPage.jsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  CalendarClock,
  Clock,
  Gauge,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { getCourseWorkspace } from '../api/courseApi'
import { getLessonAssignments } from '../api/lessonApi'
import { ApiError } from '../api/httpClient'
import DashboardTopbar from '../components/DashboardTopbar'
import LoadingScreen from '../components/LoadingScreen'

function formatDate(value) {
  if (!value) return 'No deadline set'
  return new Date(value).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CourseLessonsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedLessons, setExpandedLessons] = useState({})

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true)
      const workspaceResponse = await getCourseWorkspace(courseId, token)
      const data = workspaceResponse.data || {}

      setCourse(data.course)

      // Lấy assignments cho từng lesson
      const lessonsData = data.lessons || []
      const lessonsWithAssignments = await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const assignmentResponse = await getLessonAssignments(lesson.id, token)
            return {
              ...lesson,
              assignments: assignmentResponse.data?.assignments || [],
            }
          } catch {
            return { ...lesson, assignments: [] }
          }
        })
      )

      setLessons(lessonsWithAssignments)

      // Mở rộng tất cả lessons mặc định
      const initialExpand = {}
      lessonsWithAssignments.forEach((lesson) => {
        initialExpand[lesson.id] = true
      })
      setExpandedLessons(initialExpand)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to load course data')
    } finally {
      setLoading(false)
    }
  }, [courseId, logout, navigate, token])

  useEffect(() => {
    const timer = window.setTimeout(fetchCourseData, 0)
    return () => window.clearTimeout(timer)
  }, [fetchCourseData])

  const toggleLesson = (lessonId) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }))
  }

  const handleGradeAssignment = (assignmentId) => {
    navigate(`/lecturer/assignments/${assignmentId}/grading`, {
      state: { courseId: parseInt(courseId) },
    })
  }

  if (loading) return <LoadingScreen label="Loading course lessons..." />

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="Manage Final Grades" />
        <main className="lessons-page">
          <button className="back-link" type="button" onClick={() => navigate('/lecturer/my-courses')}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back to courses
          </button>
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" onClick={fetchCourseData}>
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

      <main className="lessons-page">
        <button className="back-link" type="button" onClick={() => navigate('/lecturer/my-courses')}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to courses
        </button>

        <div className="lessons-page__header">
          <div className="lessons-page__header-content">
            <p className="eyebrow">
              {course?.classCode || 'Course'} · {course?.semester || ''}
            </p>
            <h1>{course?.courseName || 'Course'}</h1>
            {course?.description && (
              <p className="lessons-page__description">{course.description}</p>
            )}
          </div>
          <div className="lessons-page__stats">
            <span className="stat-chip">
              <BookOpen size={16} />
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={32} />
            <h3>No lessons found</h3>
            <p>This course does not have any lessons yet.</p>
          </div>
        ) : (
          <div className="lesson-detail-list">
            {lessons.map((lesson, index) => {
              const isExpanded = expandedLessons[lesson.id] !== false
              const assignments = lesson.assignments || []

              return (
                <div className="lesson-detail-item" key={lesson.id}>
                  <div
                    className="lesson-detail-header"
                    onClick={() => toggleLesson(lesson.id)}
                  >
                    <div className="lesson-detail-header__left">
                      <span className="lesson-detail__number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="lesson-detail__title">{lesson.title}</h3>
                        <span className="lesson-detail__count">
                          {assignments.length}{' '}
                          {assignments.length === 1 ? 'assignment' : 'assignments'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="lesson-detail__toggle"
                      type="button"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="lesson-detail-assignments">
                      {assignments.length === 0 ? (
                        <p className="lesson-detail__empty">No assignments in this lesson.</p>
                      ) : (
                        assignments.map((assignment) => (
                          <div className="assignment-detail-card" key={assignment.id}>
                            <div className="assignment-detail-card__info">
                              <div className="assignment-detail-card__icon">
                                <FileText size={18} />
                              </div>
                              <div>
                                <h4 className="assignment-detail-card__title">
                                  {assignment.title}
                                </h4>
                                {assignment.description && (
                                  <p className="assignment-detail-card__description">
                                    {assignment.description}
                                  </p>
                                )}
                                <div className="assignment-detail-card__meta">
                                  <span>
                                    <CalendarClock size={13} />
                                    Submission: {formatDate(assignment.submissionDeadline)}
                                  </span>
                                  <span>
                                    <Clock size={13} />
                                    Review: {formatDate(assignment.reviewDeadline)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="assignment-detail-card__actions">
                              <button
                                className="assignment-detail-card__btn"
                                type="button"
                                onClick={() => handleGradeAssignment(assignment.id)}
                              >
                                <Gauge size={16} />
                                Grade
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}