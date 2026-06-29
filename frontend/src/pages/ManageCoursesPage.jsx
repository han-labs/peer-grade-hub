import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLecturerCourses, createCourse } from '../api/courseApi.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import { BookOpen, Plus, Loader2, AlertCircle, ArrowUpRight, GraduationCap, CheckCircle2 } from 'lucide-react'

function ManageCoursesPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Form state
  const [courseName, setCourseName] = useState('')
  const [classCode, setClassCode] = useState('')
  const [semester, setSemester] = useState('')
  const [description, setDescription] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)

  useEffect(() => {
    if (user.role !== 'LECTURER') return;
    
    let mounted = true
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getLecturerCourses(token)
        if (mounted) {
          setCourses(data || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load courses')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    fetchCourses()
    return () => { mounted = false }
  }, [user.role, token])

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    setCreateError(null)
    setSuccessMessage(null)

    if (!courseName.trim() || !classCode.trim() || !semester.trim()) {
      setCreateError('Course Name, Class Code, and Semester are required. Please do not leave them empty.')
      return
    }

    setCreateLoading(true)
    
    try {
      await createCourse({
        courseName,
        classCode,
        semester,
        description
      }, token)
      
      // Refresh list
      const data = await getLecturerCourses(token)
      setCourses(data || [])
      
      // Clear form
      setCourseName('')
      setClassCode('')
      setSemester('')
      setDescription('')
      setSuccessMessage('Course created successfully.')
      setIsCreatingCourse(false)
    } catch (err) {
      setCreateError(err.message || 'Failed to create course')
    } finally {
      setCreateLoading(false)
    }
  }

  if (user.role !== 'LECTURER') {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="Manage Courses" />
        <main className="dashboard-main">
          <div className="form-alert">
            <AlertCircle size={18} />
            <span>You must be a lecturer to view this page.</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BookOpen} label="Manage Courses" />

      <main className="courses-page">
        <div className="courses-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Teaching workspace</p>
            <h1>Manage Courses</h1>
            <p>Create courses, update course details, and open course workspaces.</p>
          </div>
          {!isCreatingCourse && (
            <button className="primary-button" onClick={() => { setIsCreatingCourse(true); setSuccessMessage(null); }}>
              <Plus size={16} /> New Course
            </button>
          )}
        </div>

        {successMessage && !isCreatingCourse && (
          <div className="form-alert" style={{ marginBottom: '24px', background: 'var(--positive-bg)', color: 'var(--positive-text)', border: '1px solid #c3e6cb' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {isCreatingCourse ? (
          <div className="create-course-panel" style={{ padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
            <div className="section-heading" style={{ marginBottom: '20px' }}>
              <h2>Create Course</h2>
            </div>
            <form className="login-form" onSubmit={handleCreateCourse}>
              {createError && (
                <div className="form-alert" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <span>{createError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label className="form-field">
                  Course Name *
                  <input
                    type="text"
                    placeholder="e.g. Object-Oriented Software Engineering"
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    disabled={createLoading}
                  />
                </label>
                <label className="form-field">
                  Class Code *
                  <input
                    type="text"
                    placeholder="e.g. OOSE-2026"
                    value={classCode}
                    onChange={e => setClassCode(e.target.value)}
                    disabled={createLoading}
                  />
                </label>
                <label className="form-field">
                  Semester *
                  <input
                    type="text"
                    placeholder="e.g. Fall 2026"
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    disabled={createLoading}
                  />
                </label>
                <label className="form-field">
                  Description
                  <input
                    type="text"
                    placeholder="Brief description of the course"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={createLoading}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="primary-button" disabled={createLoading} style={{ flex: 1, maxWidth: '200px' }}>
                  {createLoading ? <Loader2 size={18} className="button-spinner" /> : <Plus size={18} />} Create Course
                </button>
                <button type="button" className="logout-button" onClick={() => { setIsCreatingCourse(false); setCreateError(null); }} disabled={createLoading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neutral-text)', marginTop: '20px' }}>
                <Loader2 size={18} className="loading-spinner" />
                <p style={{ margin: 0 }}>Loading courses...</p>
              </div>
            ) : error ? (
              <div className="form-alert" style={{ marginTop: '20px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={32} />
                <h3>No courses found</h3>
                <p>You haven't created any courses yet.</p>
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
                      onClick={() => navigate(`/lecturer/courses/${course.id}/workspace`)}
                    >
                      Open Workspace <ArrowUpRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ManageCoursesPage
