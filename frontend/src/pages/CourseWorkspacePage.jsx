import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  getCourseWorkspace,
  updateCourse,
  createLesson,
  createLessonMaterial,
  deleteLessonMaterial,
  deleteLesson,
  archiveCourse,
  unarchiveCourse,
} from '../api/courseApi.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import {
  BookOpen,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Edit2,
  Plus,
  Link as LinkIcon,
  File,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  Archive,
  RotateCcw,
} from 'lucide-react'

function CourseWorkspacePage() {
  const { courseId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit Course State
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [editCourseData, setEditCourseData] = useState({
    courseName: '',
    classCode: '',
    semester: '',
    description: '',
  })
  const [editCourseLoading, setEditCourseLoading] = useState(false)
  const [editCourseError, setEditCourseError] = useState(null)

  // Add Lesson State
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonLoading, setLessonLoading] = useState(false)
  const [lessonError, setLessonError] = useState(null)
  const [deletingLessonId, setDeletingLessonId] = useState(null)

  // Add Material State (lessonId -> form state)
  const [addingMaterialForLesson, setAddingMaterialForLesson] = useState(null)
  const [materialType, setMaterialType] = useState('LINK')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialLabel, setMaterialLabel] = useState('')
  const [materialFileName, setMaterialFileName] = useState('')
  const [materialFilePath, setMaterialFilePath] = useState('')
  const [materialFileSizeMb, setMaterialFileSizeMb] = useState('')
  const [materialFileType, setMaterialFileType] = useState('')
  const [materialLoading, setMaterialLoading] = useState(false)
  const [materialError, setMaterialError] = useState(null)
  const [deletingMaterialId, setDeletingMaterialId] = useState(null)
  const [isStatusChanging, setIsStatusChanging] = useState(false)

  const [copySuccess, setCopySuccess] = useState('')

  const fetchWorkspace = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getCourseWorkspace(courseId, token)
      const data = response.data || response
      setWorkspace(data)
      setEditCourseData({
        courseName: data?.course?.courseName || '',
        classCode: data?.course?.classCode || '',
        semester: data?.course?.semester || '',
        description: data?.course?.description || '',
      })
    } catch (err) {
      setError(err.message || 'Failed to load course workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.role !== 'LECTURER') return
    const timer = window.setTimeout(fetchWorkspace, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user.role, token])

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(type)
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const handleUpdateCourse = async (e) => {
    e.preventDefault()
    setEditCourseError(null)
    setEditCourseLoading(true)
    try {
      await updateCourse(courseId, editCourseData, token)
      await fetchWorkspace()
      setIsEditingCourse(false)
    } catch (err) {
      setEditCourseError(err.message || 'Failed to update course')
    } finally {
      setEditCourseLoading(false)
    }
  }

  const handleCreateLesson = async (e) => {
    e.preventDefault()
    setLessonError(null)
    setLessonLoading(true)
    try {
      await createLesson(courseId, { title: lessonTitle }, token)
      setLessonTitle('')
      setIsAddingLesson(false)
      await fetchWorkspace()
    } catch (err) {
      setLessonError(err.message || 'Failed to create lesson')
    } finally {
      setLessonLoading(false)
    }
  }

  const handleCreateMaterial = async (e, lessonId) => {
    e.preventDefault()
    setMaterialError(null)
    let requestPayload = { materialType, title: materialTitle }

    if (materialType === 'LINK') {
      const trimmedUrl = materialUrl.trim()
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        setMaterialError('Invalid URL. Please enter a valid link.')
        return
      }

      requestPayload = {
        ...requestPayload,
        url: trimmedUrl,
        label: materialLabel,
      }
    } else {
      if (!materialFileName || !materialFilePath || !materialFileSizeMb || !materialFileType) {
        setMaterialError('All file material fields (File Name, File Path, File Size MB, File Type) are required.')
        return
      }

      requestPayload = {
        ...requestPayload,
        fileName: materialFileName,
        filePath: materialFilePath,
        fileSizeMb: parseFloat(materialFileSizeMb),
        fileType: materialFileType,
      }
    }

    setMaterialLoading(true)
    try {

      await createLessonMaterial(courseId, lessonId, requestPayload, token)
      
      setMaterialTitle('')
      setMaterialUrl('')
      setMaterialLabel('')
      setMaterialFileName('')
      setMaterialFilePath('')
      setMaterialFileSizeMb('')
      setMaterialFileType('')
      setAddingMaterialForLesson(null)
      await fetchWorkspace()
    } catch (err) {
      setMaterialError(err.message || 'Failed to add material')
    } finally {
      setMaterialLoading(false)
    }
  }

  const handleDeleteMaterial = async (lessonId, materialId) => {
    if (!window.confirm('Delete this material?')) return
    setMaterialError(null)
    setDeletingMaterialId(materialId)
    try {
      await deleteLessonMaterial(courseId, lessonId, materialId, token)
      await fetchWorkspace()
    } catch (err) {
      setMaterialError(err.message || 'Failed to delete material')
    } finally {
      setDeletingMaterialId(null)
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson? This will also remove its materials.')) return
    setLessonError(null)
    setDeletingLessonId(lessonId)
    try {
      await deleteLesson(courseId, lessonId, token)
      await fetchWorkspace()
    } catch (err) {
      setLessonError(err.message || 'Failed to delete lesson')
    } finally {
      setDeletingLessonId(null)
    }
  }

  const handleArchiveCourse = async () => {
    if (!window.confirm('Archive this course? Editing will be disabled until it is reactivated.')) return
    setIsStatusChanging(true)
    setError(null)
    try {
      await archiveCourse(courseId, token)
      await fetchWorkspace()
    } catch (err) {
      setError(err.message || 'Failed to archive course')
    } finally {
      setIsStatusChanging(false)
    }
  }

  const handleUnarchiveCourse = async () => {
    if (!window.confirm('Reactivate this course?')) return
    setIsStatusChanging(true)
    setError(null)
    try {
      await unarchiveCourse(courseId, token)
      await fetchWorkspace()
    } catch (err) {
      setError(err.message || 'Failed to reactivate course')
    } finally {
      setIsStatusChanging(false)
    }
  }

  if (user.role !== 'LECTURER') {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="Course Workspace" />
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
      <DashboardTopbar icon={BookOpen} label="Course Workspace" />

      <main className="dashboard-main">
        <button
          className="logout-button"
          onClick={() => navigate('/lecturer/courses')}
          style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Courses
        </button>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neutral-text)' }}>
            <Loader2 size={18} className="loading-spinner" />
            <p>Loading workspace...</p>
          </div>
        ) : error ? (
          <div className="form-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : workspace && workspace.course ? (
          <div className="dashboard-grid">
            <div className="workspace-section">
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="eyebrow">Course Details</p>
                  <h2>{workspace.course.courseName}</h2>
                  <p style={{ marginTop: '8px', color: 'var(--neutral-text)' }}>{workspace.course.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {workspace.course.courseStatus === 'ACTIVE' ? (
                    <button 
                      className="logout-button" 
                      onClick={handleArchiveCourse}
                      disabled={isStatusChanging}
                      style={{ background: 'var(--neutral-text)', color: '#fff', borderColor: 'var(--neutral-text)' }}
                    >
                      {isStatusChanging ? <Loader2 size={16} className="button-spinner" /> : <Archive size={16} />} Archive
                    </button>
                  ) : (
                    <button 
                      className="primary-button" 
                      onClick={handleUnarchiveCourse}
                      disabled={isStatusChanging}
                    >
                      {isStatusChanging ? <Loader2 size={16} className="button-spinner" /> : <RotateCcw size={16} />} Reactivate
                    </button>
                  )}
                  {workspace.course.courseStatus === 'ACTIVE' && (
                    <button 
                      className="icon-button" 
                      onClick={() => setIsEditingCourse(!isEditingCourse)}
                      title="Edit Course"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {workspace.course.courseStatus === 'ARCHIVED' && (
                <div className="form-alert" style={{ marginBottom: '24px', background: 'var(--yellow-soft)', color: '#8a6d3b', borderColor: '#faebcc' }}>
                  <AlertCircle size={18} />
                  <span>This course is archived. Editing is disabled until the course is reactivated.</span>
                </div>
              )}

              {isEditingCourse ? (
                <form className="login-form" onSubmit={handleUpdateCourse} style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Edit Course</h3>
                  {editCourseError && (
                    <div className="form-alert" style={{ marginBottom: '16px' }}>
                      <AlertCircle size={18} />
                      <span>{editCourseError}</span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <label className="form-field">
                      Course Name *
                      <input required type="text" value={editCourseData.courseName} onChange={e => setEditCourseData({ ...editCourseData, courseName: e.target.value })} />
                    </label>
                    <label className="form-field">
                      Class Code *
                      <input required type="text" value={editCourseData.classCode} onChange={e => setEditCourseData({ ...editCourseData, classCode: e.target.value })} />
                    </label>
                    <label className="form-field">
                      Semester *
                      <input required type="text" value={editCourseData.semester} onChange={e => setEditCourseData({ ...editCourseData, semester: e.target.value })} />
                    </label>
                    <label className="form-field">
                      Description
                      <input type="text" value={editCourseData.description} onChange={e => setEditCourseData({ ...editCourseData, description: e.target.value })} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="primary-button" disabled={editCourseLoading} style={{ flex: 1 }}>
                      {editCourseLoading ? <Loader2 size={18} className="button-spinner" /> : 'Save Changes'}
                    </button>
                    <button type="button" className="logout-button" onClick={() => setIsEditingCourse(false)} disabled={editCourseLoading}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px', padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--neutral-text)', display: 'block' }}>Class Code</strong>
                    <span>{workspace.course.classCode}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--neutral-text)', display: 'block' }}>Semester</strong>
                    <span>{workspace.course.semester}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--neutral-text)', display: 'block' }}>Status</strong>
                    <span className="status-badge" style={{ display: 'inline-flex', marginTop: '4px' }}>
                      <span aria-hidden="true" />
                      {workspace.course.courseStatus}
                    </span>
                  </div>
                  {workspace.course.invitationCode && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--neutral-text)', display: 'block' }}>Invitation Code</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ background: 'var(--page-bg)', padding: '4px 8px', borderRadius: '4px' }}>{workspace.course.invitationCode}</code>
                        <button className="icon-button" style={{ width: '28px', height: '28px' }} onClick={() => handleCopy(workspace.course.invitationCode, 'code')} title="Copy code">
                          {copySuccess === 'code' ? <CheckCircle2 size={14} color="var(--positive-text)" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
                <div>
                  <p className="eyebrow">Content</p>
                  <h2>Lessons</h2>
                </div>
                {workspace.course.courseStatus === 'ACTIVE' && (
                  <button className="primary-button" onClick={() => setIsAddingLesson(!isAddingLesson)}>
                    <Plus size={16} /> Add Lesson
                  </button>
                )}
              </div>

              {isAddingLesson && (
                <form className="login-form" onSubmit={handleCreateLesson} style={{ padding: '20px', background: '#fcfdff', borderRadius: '12px', border: '1px solid #d6e8f7', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', color: 'var(--blue)' }}>New Lesson</h4>
                  {lessonError && (
                    <div className="form-alert" style={{ marginBottom: '16px' }}>
                      <AlertCircle size={18} />
                      <span>{lessonError}</span>
                    </div>
                  )}
                  <label className="form-field">
                    Lesson Title *
                    <input required type="text" placeholder="e.g. Week 1: Introduction" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} disabled={lessonLoading} />
                  </label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" className="primary-button" style={{ background: 'var(--blue)', borderColor: 'var(--blue)' }} disabled={lessonLoading}>
                      {lessonLoading ? <Loader2 size={18} className="button-spinner" /> : 'Create Lesson'}
                    </button>
                    <button type="button" className="logout-button" onClick={() => setIsAddingLesson(false)} disabled={lessonLoading}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {workspace.lessons && workspace.lessons.length > 0 ? (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {workspace.lessons.map(lesson => (
                    <div key={lesson.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbf9' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{lesson.title}</h3>
                        {workspace.course.courseStatus === 'ACTIVE' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="icon-button" 
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeleteLesson(lesson.id)}
                              disabled={deletingLessonId === lesson.id}
                              title="Delete lesson"
                            >
                              {deletingLessonId === lesson.id ? <Loader2 size={14} className="button-spinner" /> : <Trash2 size={14} />}
                            </button>
                            <button 
                              className="logout-button" 
                              style={{ padding: '0 10px', minHeight: '30px', fontSize: '0.7rem' }}
                              onClick={() => {
                                setAddingMaterialForLesson(addingMaterialForLesson === lesson.id ? null : lesson.id)
                                setMaterialError(null)
                              }}
                            >
                              <Plus size={14} /> Add Material
                            </button>
                          </div>
                        )}
                      </div>

                      {addingMaterialForLesson === lesson.id && (
                        <form onSubmit={(e) => handleCreateMaterial(e, lesson.id)} style={{ padding: '20px', background: 'var(--page-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <h4 style={{ margin: '0 0 16px 0' }}>Add Material to {lesson.title}</h4>
                          {materialError && (
                            <div className="form-alert" style={{ marginBottom: '16px' }}>
                              <AlertCircle size={18} />
                              <span>{materialError}</span>
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input type="radio" name="materialType" value="LINK" checked={materialType === 'LINK'} onChange={() => setMaterialType('LINK')} />
                              Web Link
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input type="radio" name="materialType" value="FILE" checked={materialType === 'FILE'} onChange={() => setMaterialType('FILE')} />
                              File Document
                            </label>
                          </div>

                          <div style={{ display: 'grid', gap: '16px' }}>
                            <label className="form-field">
                              Title *
                              <input required type="text" placeholder="Material Title" value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} disabled={materialLoading} />
                            </label>

                            {materialType === 'LINK' ? (
                              <>
                                <label className="form-field">
                                  URL *
                                  <input required type="text" placeholder="https://..." value={materialUrl} onChange={e => setMaterialUrl(e.target.value)} disabled={materialLoading} />
                                </label>
                                <label className="form-field">
                                  Label
                                  <input type="text" placeholder="e.g. Read Chapter 1" value={materialLabel} onChange={e => setMaterialLabel(e.target.value)} disabled={materialLoading} />
                                </label>
                              </>
                            ) : (
                              <>
                                <label className="form-field">
                                  File Name *
                                  <input type="text" placeholder="e.g. syllabus.pdf" value={materialFileName} onChange={e => setMaterialFileName(e.target.value)} disabled={materialLoading} />
                                </label>
                                <label className="form-field">
                                  File Path *
                                  <input type="text" placeholder="e.g. /storage/course/file.pdf" value={materialFilePath} onChange={e => setMaterialFilePath(e.target.value)} disabled={materialLoading} />
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                  <label className="form-field">
                                    File Size (MB) *
                                    <input type="number" step="0.01" placeholder="e.g. 2.5" value={materialFileSizeMb} onChange={e => setMaterialFileSizeMb(e.target.value)} disabled={materialLoading} />
                                  </label>
                                  <label className="form-field">
                                    File Type *
                                    <input type="text" placeholder="e.g. application/pdf" value={materialFileType} onChange={e => setMaterialFileType(e.target.value)} disabled={materialLoading} />
                                  </label>
                                </div>
                              </>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button type="submit" className="primary-button" style={{ maxWidth: '200px' }} disabled={materialLoading}>
                              {materialLoading ? <Loader2 size={18} className="button-spinner" /> : 'Save Material'}
                            </button>
                            <button type="button" className="logout-button" onClick={() => setAddingMaterialForLesson(null)} disabled={materialLoading}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      <div style={{ padding: '12px 20px' }}>
                        {lesson.materials && lesson.materials.length > 0 ? (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                            {lesson.materials.map(material => (
                              <li key={material.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--page-bg)', borderRadius: '8px', border: '1px solid #eef0eb' }}>
                                <div style={{ 
                                  width: '36px', height: '36px', borderRadius: '8px', display: 'grid', placeItems: 'center', flexShrink: 0,
                                  color: material.materialType === 'LINK' ? 'var(--blue)' : 'var(--purple)',
                                  background: material.materialType === 'LINK' ? 'var(--blue-soft)' : 'var(--purple-soft)'
                                }}>
                                  {material.materialType === 'LINK' ? <LinkIcon size={18} /> : <File size={18} />}
                                </div>
                                <div>
                                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{material.title}</h4>
                                  {material.materialType === 'LINK' ? (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--neutral-text)' }}>
                                      {material.label && <span style={{ marginRight: '8px', fontWeight: 600 }}>{material.label}</span>}
                                      <a href={material.url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>{material.url}</a>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--neutral-text)' }}>
                                      <span>{material.fileName}</span>
                                      <span style={{ margin: '0 8px' }}>•</span>
                                      <span>{material.fileSizeMb} MB</span>
                                    </div>
                                  )}
                                </div>
                                {workspace.course.courseStatus === 'ACTIVE' && (
                                  <button 
                                    className="icon-button" 
                                    style={{ marginLeft: 'auto', color: 'var(--danger)' }}
                                    onClick={() => handleDeleteMaterial(lesson.id, material.id)}
                                    disabled={deletingMaterialId === material.id}
                                    title="Delete material"
                                  >
                                    {deletingMaterialId === material.id ? <Loader2 size={16} className="button-spinner" /> : <Trash2 size={16} />}
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--neutral-text)' }}>No materials added yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed #cbd4d0' }}>
                  <p style={{ color: 'var(--neutral-text)', marginBottom: '16px' }}>No lessons have been created yet.</p>
                  <button className="primary-button" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => setIsAddingLesson(true)}>
                    <Plus size={18} /> Create First Lesson
                  </button>
                </div>
              )}
            </div>

            <aside className="profile-panel">
              <div className="profile-panel__heading">
                <div>
                  <p className="eyebrow">Quick Links</p>
                  <h2>Course Settings</h2>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
                <button 
                  className="logout-button" 
                  style={{ width: '100%', justifyContent: 'flex-start', minHeight: '44px' }}
                  onClick={() => setIsEditingCourse(true)}
                >
                  <Edit2 size={16} /> Edit Course Details
                </button>
                <button 
                  className="logout-button" 
                  style={{ width: '100%', justifyContent: 'flex-start', minHeight: '44px' }}
                  onClick={() => navigate(`/lecturer/courses/${courseId}/groups`)}
                >
                  <Users size={16} /> Manage Groups
                </button>
                <div style={{ padding: '16px', background: 'var(--page-bg)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--neutral-text)' }}>
                  Assignments configuration will be available in upcoming modules.
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default CourseWorkspacePage
