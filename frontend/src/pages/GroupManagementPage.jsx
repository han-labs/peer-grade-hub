import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourseGroups, generateGroups, updateGroupDeadline, lockAllGroups, unlockGroups } from '../api/groupApi.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import {
  Users,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react'

function GroupManagementPage() {
  const { courseId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [courseDetails, setCourseDetails] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [successMessage, setSuccessMessage] = useState(null)

  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [numberOfGroups, setNumberOfGroups] = useState('')
  const [maxGroupSize, setMaxGroupSize] = useState('')
  const [groupFormationDeadline, setGroupFormationDeadline] = useState('')

  const [updateDeadlineLoading, setUpdateDeadlineLoading] = useState(false)
  const [updateDeadlineError, setUpdateDeadlineError] = useState(null)
  const [newDeadline, setNewDeadline] = useState('')

  const [lockUnlockLoading, setLockUnlockLoading] = useState(false)
  const [lockUnlockError, setLockUnlockError] = useState(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCourseGroups(courseId, token)
      
      const courseInfo = data?.course || data?.data?.course || data || {}
      const extractedDeadline = data?.groupFormationDeadline || data?.data?.groupFormationDeadline || courseInfo?.groupFormationDeadline
      
      setCourseDetails({
        ...courseInfo,
        groupFormationDeadline: extractedDeadline
      })
      setGroups(data?.groups || data?.data?.groups || [])
    } catch (err) {
      setError(err.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.role !== 'LECTURER') return
    fetchGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user.role, token])

  const formatDateTime = (dt) => {
    if (!dt) return dt
    return dt.length === 16 ? `${dt}:00` : dt
  }

  const handleGenerateGroups = async (e) => {
    e.preventDefault()
    setGenerateError(null)
    setSuccessMessage(null)

    if (groups.length > 0) return

    if (!numberOfGroups || parseInt(numberOfGroups) < 1) {
      setGenerateError('Number of Groups must be at least 1.')
      return
    }
    if (!maxGroupSize || parseInt(maxGroupSize) < 1) {
      setGenerateError('Max Group Size must be at least 1.')
      return
    }
    if (!groupFormationDeadline || new Date(groupFormationDeadline) <= new Date()) {
      setGenerateError('The group formation deadline must be a future date and time.')
      return
    }

    setGenerateLoading(true)
    try {
      await generateGroups(courseId, {
        numberOfGroups: parseInt(numberOfGroups),
        maxGroupSize: parseInt(maxGroupSize),
        groupFormationDeadline: formatDateTime(groupFormationDeadline)
      }, token)
      setSuccessMessage('Groups successfully generated.')
      setNumberOfGroups('')
      setMaxGroupSize('')
      setGroupFormationDeadline('')
      await fetchGroups()
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate groups')
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleUpdateDeadline = async (e) => {
    e.preventDefault()
    setUpdateDeadlineError(null)
    setSuccessMessage(null)

    if (!newDeadline || new Date(newDeadline) <= new Date()) {
      setUpdateDeadlineError('The group formation deadline must be a future date and time.')
      return
    }

    setUpdateDeadlineLoading(true)
    try {
      await updateGroupDeadline(courseId, {
        groupFormationDeadline: formatDateTime(newDeadline)
      }, token)
      setSuccessMessage('Deadline updated successfully.')
      setNewDeadline('')
      await fetchGroups()
    } catch (err) {
      setUpdateDeadlineError(err.message || 'Failed to update deadline')
    } finally {
      setUpdateDeadlineLoading(false)
    }
  }

  const handleLockGroups = async () => {
    if (!window.confirm('Are you sure you want to lock all groups?')) return
    setLockUnlockError(null)
    setSuccessMessage(null)
    setLockUnlockLoading(true)
    try {
      await lockAllGroups(courseId, token)
      setSuccessMessage('All groups have been locked.')
      await fetchGroups()
    } catch (err) {
      setLockUnlockError(err.message || 'Failed to lock groups')
    } finally {
      setLockUnlockLoading(false)
    }
  }

  const handleUnlockGroups = async () => {
    if (!window.confirm('Are you sure you want to unlock groups?')) return
    setLockUnlockError(null)
    setSuccessMessage(null)
    setLockUnlockLoading(true)
    try {
      await unlockGroups(courseId, token)
      setSuccessMessage('Groups have been unlocked.')
      await fetchGroups()
    } catch (err) {
      setLockUnlockError(err.message || 'Failed to unlock groups')
    } finally {
      setLockUnlockLoading(false)
    }
  }

  if (user.role !== 'LECTURER') {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Users} label="Group Management" />
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
      <DashboardTopbar icon={Users} label="Group Management" />

      <main className="dashboard-main">
        <button
          className="logout-button"
          onClick={() => navigate(`/lecturer/courses/${courseId}/workspace`)}
          style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Workspace
        </button>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neutral-text)' }}>
            <Loader2 size={18} className="loading-spinner" />
            <p>Loading groups...</p>
          </div>
        ) : error ? (
          <div className="form-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <div className="dashboard-grid">
            <div className="workspace-section">
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="eyebrow">Groups for Course</p>
                  <h2>{courseDetails?.courseName}</h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px', padding: '20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--neutral-text)', display: 'block' }}>Total Groups</strong>
                  <span>{groups.length}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--neutral-text)', display: 'block' }}>Group Formation Deadline</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--neutral-text)" />
                    <span>{courseDetails?.groupFormationDeadline ? new Date(courseDetails.groupFormationDeadline).toLocaleString() : 'Not Set'}</span>
                  </div>
                </div>
              </div>

              {groups.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {groups.map((group) => (
                    <article key={group.id} className="demo-feature" style={{ padding: '20px' }}>
                      <div className="demo-feature__copy" style={{ marginBottom: '16px' }}>
                        <div className="demo-feature__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="status-badge" style={{ margin: 0 }}>
                            <span aria-hidden="true" />
                            {group.groupStatus}
                          </span>
                          <small>{group.memberCount} / {group.maxMembers} members</small>
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>{group.groupName}</h3>
                      </div>
                      
                      <div style={{ background: 'var(--page-bg)', padding: '12px', borderRadius: '8px', border: '1px solid #eef0eb' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--neutral-text)' }}>Members</h4>
                        {group.members && group.members.length > 0 ? (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                            {group.members.map((member) => (
                              <li key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <div style={{ background: 'var(--blue-soft)', color: 'var(--blue)', width: '24px', height: '24px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                                  <User size={12} />
                                </div>
                                <span>{member.studentName || `Student ${member.studentId}`}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neutral-text)', fontStyle: 'italic' }}>No members yet</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed #cbd4d0' }}>
                  <Users size={32} color="var(--neutral-text)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 8px 0' }}>No Groups Generated</h3>
                  <p style={{ color: 'var(--neutral-text)', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Groups have not been formed for this course yet. Use the settings panel to configure and generate course groups.
                  </p>
                </div>
              )}
            </div>

            <aside className="profile-panel">
              <div className="profile-panel__heading">
                <div>
                  <p className="eyebrow">Group Tools</p>
                  <h2>Settings</h2>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {successMessage && (
                  <div className="form-alert" style={{ background: 'var(--positive-bg)', color: 'var(--positive-text)', border: '1px solid #c3e6cb' }}>
                    <CheckCircle2 size={18} />
                    <span>{successMessage}</span>
                  </div>
                )}
                {lockUnlockError && (
                  <div className="form-alert">
                    <AlertCircle size={18} />
                    <span>{lockUnlockError}</span>
                  </div>
                )}

                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Generate Groups</h3>
                  {groups.length > 0 && (
                    <div className="form-alert" style={{ marginBottom: '16px', background: 'var(--blue-soft)', color: 'var(--blue)', border: '1px solid #b3d4f0' }}>
                      <Users size={18} />
                      <span>Groups have already been generated for this course. Existing groups are displayed below.</span>
                    </div>
                  )}
                  <form onSubmit={handleGenerateGroups} noValidate style={{ display: 'grid', gap: '12px' }}>
                    {generateError && (
                      <div className="form-alert" style={{ marginBottom: '8px' }}>
                        <AlertCircle size={18} />
                        <span>{generateError}</span>
                      </div>
                    )}
                    <label className="form-field">
                      Number of Groups *
                      <input type="number" value={numberOfGroups} onChange={e => setNumberOfGroups(e.target.value)} disabled={generateLoading || groups.length > 0} />
                    </label>
                    <label className="form-field">
                      Max Group Size *
                      <input type="number" value={maxGroupSize} onChange={e => setMaxGroupSize(e.target.value)} disabled={generateLoading || groups.length > 0} />
                    </label>
                    <label className="form-field">
                      Formation Deadline *
                      <input type="datetime-local" value={groupFormationDeadline} onChange={e => setGroupFormationDeadline(e.target.value)} disabled={generateLoading || groups.length > 0} />
                    </label>
                    <button type="submit" className="primary-button" disabled={generateLoading || groups.length > 0} style={{ marginTop: '8px' }}>
                      {generateLoading ? <Loader2 size={18} className="button-spinner" /> : 'Generate Groups'}
                    </button>
                  </form>
                </div>

                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Update Deadline</h3>
                  <form onSubmit={handleUpdateDeadline} noValidate style={{ display: 'grid', gap: '12px' }}>
                    {updateDeadlineError && (
                      <div className="form-alert" style={{ marginBottom: '8px' }}>
                        <AlertCircle size={18} />
                        <span>{updateDeadlineError}</span>
                      </div>
                    )}
                    <label className="form-field">
                      New Deadline *
                      <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} disabled={updateDeadlineLoading} />
                    </label>
                    <button type="submit" className="logout-button" disabled={updateDeadlineLoading} style={{ marginTop: '8px', justifyContent: 'center' }}>
                      {updateDeadlineLoading ? <Loader2 size={18} className="button-spinner" /> : 'Save Deadline'}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Manual Control</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button 
                      className="primary-button" 
                      style={{ background: 'var(--danger)', borderColor: 'var(--danger)', width: '100%', display: 'flex', gap: '8px' }}
                      onClick={handleLockGroups}
                      disabled={lockUnlockLoading}
                    >
                      <Lock size={16} />
                      {lockUnlockLoading ? 'Processing...' : 'Lock All Groups'}
                    </button>
                    <button 
                      className="logout-button" 
                      style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '8px' }}
                      onClick={handleUnlockGroups}
                      disabled={lockUnlockLoading}
                    >
                      <Unlock size={16} />
                      {lockUnlockLoading ? 'Processing...' : 'Unlock Groups'}
                    </button>
                  </div>
                </div>

              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

export default GroupManagementPage
