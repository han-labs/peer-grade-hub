// frontend/src/pages/LecturerCoursesPage.jsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getActiveCourses } from '../api/courseApi' 
import { ApiError } from '../api/httpClient'
import DashboardTopbar from '../components/DashboardTopbar'
import LoadingScreen from '../components/LoadingScreen'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function LecturerCoursesPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getActiveCourses(token) 
      setCourses(response.data || [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [logout, navigate, token])

  useEffect(() => {
    const timer = window.setTimeout(fetchCourses, 0)
    return () => window.clearTimeout(timer)
  }, [fetchCourses])

  const handleSelectCourse = (courseId) => {
    navigate(`/lecturer/courses/${courseId}/lessons`)
  }

  if (loading) return <LoadingScreen label="Loading your courses..." />

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="My Courses" />
        <main className="courses-page">
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" onClick={fetchCourses}>Retry</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BookOpen} label="My Courses" />

      <main className="courses-page">
        <div className="courses-page__header">
          <p className="eyebrow">Teaching workspace</p>
          <h1>My Courses</h1>
          <p>Select a course to view its lessons and manage content.</p>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={32} />
            <h3>No courses found</h3>
            <p>You are not assigned to any course yet.</p>
          </div>
        ) : (
          <div className="course-grid">
            {courses.map(course => (
              <div className="course-card" key={course.id}>
                <div className="course-card__header">
                  <div className="course-card__badge">
                    <span className={`status-badge status-badge--${course.courseStatus?.toLowerCase() || 'active'}`}>
                      {course.courseStatus || 'ACTIVE'}
                    </span>
                  </div>
                </div>
                <div className="course-card__body">
                  <h3 className="course-card__title">{course.courseName}</h3>
                  <div className="course-card__meta">
                    <span>
                      <span className="meta-label">Class Code</span>
                      <strong>{course.classCode}</strong>
                    </span>
                    <span>
                      <span className="meta-label">Semester</span>
                      <strong>{course.semester}</strong>
                    </span>
                  </div>
                  {course.description && (
                    <p className="course-card__description">{course.description}</p>
                  )}
                  <div className="course-card__invitation">
                    <span>Invitation code</span>
                    <code>{course.invitationCode || '—'}</code>
                  </div>
                </div>
                <button 
                  className="course-card__action"
                  onClick={() => handleSelectCourse(course.id)}
                >
                  View Lessons <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
