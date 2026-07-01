import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourseGroups, generateGroups, updateGroupDeadline, lockAllGroups, unlockGroups, removeGroupMember, addGroups, updateMaxGroupSize, deleteGroup } from '../api/groupApi.js'
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
  Trash2,
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

  const [removingMemberId, setRemovingMemberId] = useState(null)
  const [memberActionError, setMemberActionError] = useState(null)

  const [addGroupsCount, setAddGroupsCount] = useState('')
  const [addGroupsMaxMembers, setAddGroupsMaxMembers] = useState('')
  const [addGroupsLoading, setAddGroupsLoading] = useState(false)
  const [addGroupsError, setAddGroupsError] = useState(null)

  const [updateSizeMaxMembers, setUpdateSizeMaxMembers] = useState('')
  const [updateSizeLoading, setUpdateSizeLoading] = useState(false)
  const [updateSizeError, setUpdateSizeError] = useState(null)

  const [deletingGroupId, setDeletingGroupId] = useState(null)

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
    const timer = window.setTimeout(fetchGroups, 0)
    return () => window.clearTimeout(timer)
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

  const handleRemoveMember = async (groupId, memberId) => {
    if (!groupId) {
      setMemberActionError('Cannot remove this member because the group ID is missing from the response.')
      return
    }
    if (!memberId) {
      setMemberActionError('Cannot remove this member because the group member ID is missing from the response.')
      return
    }
    if (!window.confirm('Remove this student from the group?')) return
    setMemberActionError(null)
    setSuccessMessage(null)
    setRemovingMemberId(memberId)
    try {
      await removeGroupMember(courseId, groupId, memberId, token)
      setSuccessMessage('Group member removed successfully.')
      await fetchGroups()
    } catch (err) {
      // Better error extraction for payload/message structures natively matching ApiError design
      const msg = err.payload?.message || err.message || 'An unexpected error occurred.'
      setMemberActionError(msg)
    } finally {
      setRemovingMemberId(null)
    }
  }

  const handleAddGroups = async (e) => {
    e.preventDefault()
    setAddGroupsError(null)
    setSuccessMessage(null)

    if (!addGroupsCount || parseInt(addGroupsCount) < 1) {
      setAddGroupsError('Number of groups to add must be at least 1.')
      return
    }
    if (!addGroupsMaxMembers || parseInt(addGroupsMaxMembers) < 1) {
      setAddGroupsError('Max Group Size must be at least 1.')
      return
    }

    setAddGroupsLoading(true)
    try {
      await addGroups(courseId, {
        count: parseInt(addGroupsCount),
        maxMembers: parseInt(addGroupsMaxMembers)
      }, token)
      setSuccessMessage('Groups added successfully.')
      setAddGroupsCount('')
      setAddGroupsMaxMembers('')
      await fetchGroups()
    } catch (err) {
      const msg = err.payload?.message || err.message || 'Failed to add groups'
      setAddGroupsError(msg)
    } finally {
      setAddGroupsLoading(false)
    }
  }

  const handleUpdateMaxGroupSize = async (e) => {
    e.preventDefault()
    setUpdateSizeError(null)
    setSuccessMessage(null)

    if (!updateSizeMaxMembers || parseInt(updateSizeMaxMembers) < 1) {
      setUpdateSizeError('Max Group Size must be at least 1.')
      return
    }

    setUpdateSizeLoading(true)
    try {
      await updateMaxGroupSize(courseId, {
        maxGroupSize: parseInt(updateSizeMaxMembers)
      }, token)
      setSuccessMessage('Max group size updated successfully.')
      setUpdateSizeMaxMembers('')
      await fetchGroups()
    } catch (err) {
      const msg = err.payload?.message || err.message || 'Failed to update max group size'
      setUpdateSizeError(msg)
    } finally {
      setUpdateSizeLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this empty group?')) return
    setMemberActionError(null)
    setSuccessMessage(null)
    setDeletingGroupId(groupId)

    try {
      await deleteGroup(courseId, groupId, token)
      setSuccessMessage('Group deleted successfully.')
      await fetchGroups()
    } catch (err) {
      const msg = err.payload?.message || err.message || 'Failed to delete group'
      setMemberActionError(msg)
    } finally {
      setDeletingGroupId(null)
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            className="logout-button"
            onClick={() => navigate('/lecturer/manage-groups')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Group Courses
          </button>
          <button
            className="logout-button"
            onClick={() => navigate(`/lecturer/courses/${courseId}/workspace`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Workspace
          </button>
        </div>

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

              {memberActionError && (
                <div className="form-alert" style={{ marginBottom: '24px' }}>
                  <AlertCircle size={18} />
                  <span>{memberActionError}</span>
                </div>
              )}

              {groups.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {groups.map((group) => {
                    const isLocked = group.groupStatus === 'LOCKED'
                    const gId = group.groupId || group.id
                    const isEmpty = !group.members || group.members.length === 0
                    const canDelete = isEmpty && !isLocked && courseDetails?.courseStatus !== 'ARCHIVED'
                    
                    return (
                    <article key={gId || group.groupName} className="demo-feature" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span className="status-badge" style={{ margin: 0 }}>
                            <span aria-hidden="true" />
                            {group.groupStatus}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <small style={{ fontWeight: 500, color: 'var(--neutral-text)' }}>{group.memberCount} / {group.maxMembers} members</small>
                            {canDelete && (
                              <button
                                type="button"
                                className="icon-button"
                                style={{ color: 'var(--danger)', opacity: deletingGroupId === gId ? 0.5 : 1, padding: '4px' }}
                                onClick={() => handleDeleteGroup(gId)}
                                disabled={deletingGroupId !== null}
                                title="Delete Group"
                              >
                                {deletingGroupId === gId ? <Loader2 size={16} className="button-spinner" /> : <Trash2 size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-color)' }}>{group.groupName}</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        {isLocked && (
                          <div style={{ marginBottom: '12px', padding: '8px 10px', background: 'var(--yellow-soft)', color: 'var(--yellow)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <Lock size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ lineHeight: 1.4 }}>Groups are locked. Roster modifications are not allowed.</span>
                          </div>
                        )}
                        <div style={{ 
                          maxHeight: '220px', 
                          overflowY: 'auto', 
                          paddingRight: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {group.members && group.members.length > 0 ? (
                            group.members.map((member) => {
                              const mId = member.groupMemberId
                              const mName = member.studentName || member.fullName || member.username || `Student ${member.userId}`
                              const mSub = member.userId || member.email
                              
                              return (
                                <div key={mId || `${gId}-${mName}`} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  padding: '10px 12px',
                                  background: 'var(--page-bg)',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '8px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                    <div style={{ background: 'var(--blue-soft)', color: 'var(--blue)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <User size={16} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                      <span style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mName}</span>
                                      {mSub && <span style={{ fontSize: '0.75rem', color: 'var(--neutral-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mSub}</span>}
                                    </div>
                                  </div>
                                  {!isLocked && (
                                    <button
                                      type="button"
                                      className="icon-button"
                                      style={{ color: 'var(--danger)', opacity: removingMemberId === mId ? 0.5 : 1, padding: '4px', flexShrink: 0, marginLeft: '8px' }}
                                      onClick={() => handleRemoveMember(gId, mId)}
                                      disabled={removingMemberId !== null}
                                      title="Remove Member"
                                    >
                                      {removingMemberId === mId ? <Loader2 size={16} className="button-spinner" /> : <Trash2 size={16} />}
                                    </button>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--neutral-text)', fontStyle: 'italic' }}>No members yet</p>
                          )}
                        </div>
                      </div>
                    </article>
                  )})}
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
                  {groups.length > 0 ? (
                    <div className="form-alert" style={{ background: 'var(--blue-soft)', color: 'var(--blue)', border: '1px solid #b3d4f0' }}>
                      <Users size={18} />
                      <span>Groups have already been generated. Use Modify Group Setup below to add groups or update group size.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleGenerateGroups} noValidate style={{ display: 'grid', gap: '12px' }}>
                      {generateError && (
                        <div className="form-alert" style={{ marginBottom: '8px' }}>
                          <AlertCircle size={18} />
                          <span>{generateError}</span>
                        </div>
                      )}
                      <label className="form-field">
                        Number of Groups *
                        <input type="number" value={numberOfGroups} onChange={e => setNumberOfGroups(e.target.value)} disabled={generateLoading} />
                      </label>
                      <label className="form-field">
                        Max Group Size *
                        <input type="number" value={maxGroupSize} onChange={e => setMaxGroupSize(e.target.value)} disabled={generateLoading} />
                      </label>
                      <label className="form-field">
                        Formation Deadline *
                        <input type="datetime-local" value={groupFormationDeadline} onChange={e => setGroupFormationDeadline(e.target.value)} disabled={generateLoading} />
                      </label>
                      <button type="submit" className="primary-button" disabled={generateLoading} style={{ marginTop: '8px' }}>
                        {generateLoading ? <Loader2 size={18} className="button-spinner" /> : 'Generate Groups'}
                      </button>
                    </form>
                  )}
                </div>

                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Modify Group Setup</h3>
                  {groups.length > 0 && groups[0].groupStatus === 'LOCKED' && (
                    <div className="form-alert" style={{ marginBottom: '16px', background: 'var(--yellow-soft)', color: 'var(--yellow)', border: '1px solid #faebcc' }}>
                      <Lock size={18} />
                      <span>Groups are locked. Please unlock groups before modifying group configuration.</span>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--neutral-text)' }}>Add More Groups</h4>
                    <form onSubmit={handleAddGroups} noValidate style={{ display: 'grid', gap: '12px' }}>
                      {addGroupsError && (
                        <div className="form-alert" style={{ marginBottom: '8px' }}>
                          <AlertCircle size={18} />
                          <span>{addGroupsError}</span>
                        </div>
                      )}
                      <label className="form-field">
                        Number of Groups to Add *
                        <input type="number" value={addGroupsCount} onChange={e => setAddGroupsCount(e.target.value)} disabled={addGroupsLoading || (groups.length > 0 && groups[0].groupStatus === 'LOCKED') || (courseDetails?.courseStatus === 'ARCHIVED')} />
                      </label>
                      <label className="form-field">
                        Max Group Size *
                        <input type="number" value={addGroupsMaxMembers} onChange={e => setAddGroupsMaxMembers(e.target.value)} disabled={addGroupsLoading || (groups.length > 0 && groups[0].groupStatus === 'LOCKED') || (courseDetails?.courseStatus === 'ARCHIVED')} />
                      </label>
                      <button type="submit" className="logout-button" disabled={addGroupsLoading || (groups.length > 0 && groups[0].groupStatus === 'LOCKED') || (courseDetails?.courseStatus === 'ARCHIVED')} style={{ marginTop: '4px', justifyContent: 'center' }}>
                        {addGroupsLoading ? <Loader2 size={18} className="button-spinner" /> : 'Add Groups'}
                      </button>
                    </form>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--neutral-text)' }}>Update Max Group Size</h4>
                    <form onSubmit={handleUpdateMaxGroupSize} noValidate style={{ display: 'grid', gap: '12px' }}>
                      {updateSizeError && (
                        <div className="form-alert" style={{ marginBottom: '8px' }}>
                          <AlertCircle size={18} />
                          <span>{updateSizeError}</span>
                        </div>
                      )}
                      <label className="form-field">
                        New Max Group Size *
                        <input type="number" value={updateSizeMaxMembers} onChange={e => setUpdateSizeMaxMembers(e.target.value)} disabled={updateSizeLoading || (groups.length > 0 && groups[0].groupStatus === 'LOCKED') || (courseDetails?.courseStatus === 'ARCHIVED')} />
                      </label>
                      <button type="submit" className="logout-button" disabled={updateSizeLoading || (groups.length > 0 && groups[0].groupStatus === 'LOCKED') || (courseDetails?.courseStatus === 'ARCHIVED')} style={{ marginTop: '4px', justifyContent: 'center' }}>
                        {updateSizeLoading ? <Loader2 size={18} className="button-spinner" /> : 'Update Size'}
                      </button>
                    </form>
                  </div>
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
                      <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} disabled={updateDeadlineLoading || (courseDetails?.courseStatus === 'ARCHIVED')} />
                    </label>
                    <button type="submit" className="logout-button" disabled={updateDeadlineLoading || (courseDetails?.courseStatus === 'ARCHIVED')} style={{ marginTop: '8px', justifyContent: 'center' }}>
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
                      disabled={lockUnlockLoading || (courseDetails?.courseStatus === 'ARCHIVED')}
                    >
                      <Lock size={16} />
                      {lockUnlockLoading ? 'Processing...' : 'Lock All Groups'}
                    </button>
                    <button 
                      className="logout-button" 
                      style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '8px' }}
                      onClick={handleUnlockGroups}
                      disabled={lockUnlockLoading || (courseDetails?.courseStatus === 'ARCHIVED')}
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
