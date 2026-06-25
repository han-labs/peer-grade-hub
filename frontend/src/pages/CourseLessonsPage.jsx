// frontend/src/pages/CourseLessonsPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, ChevronRight, Calendar } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { getCourseWorkspace } from '../api/courseApi'
import { ApiError } from '../api/httpClient'
import DashboardTopbar from '../components/DashboardTopbar'
import LoadingScreen from '../components/LoadingScreen'

export default function CourseLessonsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const response = await getCourseWorkspace(courseId, token)
      const data = response.data
      
      setCourse(data.course)
      setLessons(data.lessons || [])
      
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
  }

  const handleSelectLesson = (lessonId) => {
    navigate(`/lecturer/courses/${courseId}/lessons/${lessonId}/assignments`)
  }

  if (loading) return <LoadingScreen label="Loading course lessons..." />

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="Course Lessons" />
        <main className="lessons-page">
          <button className="back-link" type="button" onClick={() => navigate('/lecturer/courses')}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back to courses
          </button>
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" onClick={fetchCourseData}>Retry</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={FileText} label="Course Lessons" />

      <main className="lessons-page">
        <button className="back-link" type="button" onClick={() => navigate('/lecturer/courses')}>
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
            <span className="stat-chip">
              <span className="status-badge status-badge--active">
                {course?.courseStatus || 'ACTIVE'}
              </span>
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
          <div className="lesson-list">
            {lessons.map((lesson, index) => (
              <div 
                className="lesson-item" 
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson.id)}
              >
                <div className="lesson-item__number">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="lesson-item__content">
                  <div className="lesson-item__info">
                    <h3 className="lesson-item__title">{lesson.title}</h3>
                    <div className="lesson-item__meta">
                      <span>
                        <FileText size={14} />
                        {lesson.materials?.length || 0} materials
                      </span>
                    </div>
                  </div>
                  <button className="lesson-item__action" type="button">
                    View assignments <ChevronRight size={18} />
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