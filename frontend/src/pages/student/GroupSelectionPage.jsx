import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Lock, UsersRound } from 'lucide-react'
import { useAuth } from '../../auth/useAuth.js'
import { ApiError } from '../../api/httpClient.js'
import { getGroupSelection, joinGroup, leaveGroup } from '../../api/studentParticipationApi.js'
import DashboardTopbar from '../../components/DashboardTopbar.jsx'
import LoadingScreen from '../../components/LoadingScreen.jsx'

function formatDeadline(value) {
  if (!value) return 'No deadline set'
  return new Date(value).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GroupSelectionPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadGroups = useCallback(() => {
    setError('')
    return getGroupSelection(courseId, token)
      .then((response) => setData(response.data))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || 'Groups could not be loaded.')
      })
      .finally(() => setLoading(false))
  }, [courseId, token, logout, navigate])

  useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
      if (!mounted) return
      setLoading(true)

      getGroupSelection(courseId, token)
        .then((response) => {
          if (mounted) setData(response.data)
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            logout()
            navigate('/login', { replace: true })
            return
          }
          if (mounted) setError(err.message || 'Groups could not be loaded.')
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    }, 0)

    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [courseId, token, logout, navigate])

  const currentGroup = useMemo(() => {
    if (!data?.currentGroupId) return null
    return data.groups?.find((group) => group.groupId === data.currentGroupId) || null
  }, [data])

  const handleJoin = (groupId) => {
    setActionLoading(true)
    setError('')
    setNotice('')

    joinGroup(courseId, groupId, token)
      .then((response) => {
        setNotice(response.data?.message || response.message || 'Group joined successfully.')
        return loadGroups()
      })
      .catch((err) => setError(err.message || 'Group could not be joined.'))
      .finally(() => setActionLoading(false))
  }

  const handleLeave = () => {
    setActionLoading(true)
    setError('')
    setNotice('')

    leaveGroup(courseId, token)
      .then((response) => {
        setNotice(response.data?.message || response.message || 'Group left successfully.')
        return loadGroups()
      })
      .catch((err) => setError(err.message || 'Group could not be left.'))
      .finally(() => setActionLoading(false))
  }

  if (loading) return <LoadingScreen label="Loading groups..." />

  const canLeaveCurrentGroup = currentGroup && !data?.deadlinePassed && !currentGroup.locked

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={UsersRound} label="Join Course / Group" />

      <main className="dashboard-main student-participation-page">
        <button className="back-link" type="button" onClick={() => navigate('/student/courses')}>
          <ArrowLeft size={17} />
          Back to courses
        </button>

        <div className="student-participation-header">
          <p className="eyebrow">Course groups</p>
          <h1>{data?.courseName || 'Groups'}</h1>
          <div className="group-deadline-row">
            <span className="stat-chip">
              <Clock size={16} />
              {formatDeadline(data?.groupFormationDeadline)}
            </span>
            <span className={`status-badge ${data?.deadlinePassed ? 'status-badge--archived' : 'status-badge--active'}`}>
              {data?.deadlinePassed ? 'DEADLINE PASSED' : 'OPEN'}
            </span>
          </div>
        </div>

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" type="button" onClick={loadGroups}>
              Retry
            </button>
          </div>
        )}

        {notice && <p className="success-message">{notice}</p>}

        {currentGroup && (
          <section className="current-group-panel">
            <div>
              <p className="eyebrow">Current group</p>
              <h2>{currentGroup.groupName}</h2>
              <p>
                {currentGroup.currentMembers}/{currentGroup.maxMembers} members
              </p>
            </div>
            {canLeaveCurrentGroup ? (
              <button
                className="secondary-action"
                type="button"
                disabled={actionLoading}
                onClick={handleLeave}
              >
                Leave Group
              </button>
            ) : (
              <span className="inline-status">
                <Lock size={16} />
                Locked
              </span>
            )}
          </section>
        )}

        {data?.groups?.length ? (
          <div className="group-selection-grid">
            {data.groups.map((group) => {
              const isCurrentGroup = data.currentGroupId === group.groupId
              const canJoin = !data.currentGroupId && !data.deadlinePassed && !group.full && !group.locked

              return (
                <article className="group-selection-card" key={group.groupId}>
                  <div className="group-selection-card__header">
                    <div>
                      <h3>{group.groupName}</h3>
                      <p>{group.currentMembers}/{group.maxMembers} members</p>
                    </div>
                    <div className="group-status-stack">
                      {isCurrentGroup && <span className="status-badge status-badge--active">CURRENT</span>}
                      {group.full && <span className="status-badge status-badge--archived">GROUP FULL</span>}
                      {group.locked && <span className="status-badge status-badge--archived">LOCKED</span>}
                    </div>
                  </div>

                  <div className="member-list">
                    {group.members?.length ? (
                      group.members.map((member) => (
                        <span className="member-pill" key={`${group.groupId}-${member.fullName}`}>
                          {member.fullName}
                        </span>
                      ))
                    ) : (
                      <span className="member-list__empty">No members yet</span>
                    )}
                  </div>

                  <div className="group-selection-card__action">
                    {isCurrentGroup ? (
                      <span className="inline-status">
                        <CheckCircle2 size={16} />
                        Joined
                      </span>
                    ) : (
                      canJoin && (
                        <button
                          className="compact-primary-action"
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleJoin(group.groupId)}
                        >
                          Join Group
                        </button>
                      )
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <UsersRound size={32} />
            <h3>No groups found</h3>
            <p>Your lecturer has not created groups for this course yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}
