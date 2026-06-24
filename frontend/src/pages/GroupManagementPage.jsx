import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCourseGroups } from '../api/groupApi.js'
import { useAuth } from '../auth/useAuth.js'
import DashboardTopbar from '../components/DashboardTopbar.jsx'
import {
  Users,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react'

function GroupManagementPage() {
  const { courseId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [courseDetails, setCourseDetails] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCourseGroups(courseId, token)
      setCourseDetails(data.course)
      setGroups(data.groups || [])
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
              <div style={{ marginTop: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--page-bg)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--neutral-text)' }}>
                  Group generation and deadline configuration tools will be available here.
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
