import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLecturerCourses, createCourse } from '../api/courseApi.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import { BookOpen, Plus, Loader2, AlertCircle, ArrowUpRight, GraduationCap } from 'lucide-react'

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

      <main className="dashboard-main">
        <section className="welcome-band">
          <div>
            <p className="dashboard-date">UC-02 Manage Courses</p>
            <h1>Course Portfolio</h1>
            <p>Create and manage your courses. Open a course workspace to configure groups and assignments.</p>
          </div>
        </section>

        <section className="dashboard-grid" style={{ marginTop: '32px' }}>
          <div className="workspace-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Your courses</p>
                <h2>Active Courses</h2>
              </div>
            </div>

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
              <p style={{ color: 'var(--neutral-text)', marginTop: '20px' }}>You haven't created any courses yet.</p>
            ) : (
              <div className="lecturer-demo-grid">
                {courses.map(course => (
                  <article key={course.id} className="demo-feature">
                    <div className="demo-feature__icon">
                      <GraduationCap size={23} aria-hidden="true" />
                    </div>
                    <div className="demo-feature__copy">
                      <div className="demo-feature__meta">
                        <span>{course.classCode}</span>
                        <small>{course.semester}</small>
                      </div>
                      <h2>{course.courseName}</h2>
                      <p style={{ marginBottom: '8px' }}>{course.description}</p>
                      {course.invitationCode && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--ink)' }}>
                          <strong>Join Code:</strong> {course.invitationCode}
                        </p>
                      )}
                      <p style={{ fontSize: '0.8rem' }}>
                        <span className="status-badge" style={{ display: 'inline-flex', marginTop: '4px' }}>
                          <span aria-hidden="true" />
                          {course.courseStatus}
                        </span>
                      </p>
                    </div>
                    <button
                      className="demo-feature__action"
                      type="button"
                      onClick={() => navigate(`/lecturer/courses/${course.id}/workspace`)}
                    >
                      Open Workspace
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="profile-panel">
            <div className="profile-panel__heading">
              <div>
                <p className="eyebrow">New Course</p>
                <h2>Create Course</h2>
              </div>
            </div>

            <form className="login-form" onSubmit={handleCreateCourse} style={{ marginTop: '20px' }}>
              {createError && (
                <div className="form-alert">
                  <AlertCircle size={18} />
                  <span>{createError}</span>
                </div>
              )}

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

              <button 
                type="submit" 
                className="primary-button" 
                disabled={createLoading}
                style={{ marginTop: '10px' }}
              >
                {createLoading ? <Loader2 size={18} className="button-spinner" /> : <Plus size={18} />}
                Create Course
              </button>
            </form>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default ManageCoursesPage
