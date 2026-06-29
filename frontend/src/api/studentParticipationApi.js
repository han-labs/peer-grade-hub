import { apiRequest } from './httpClient.js'

const STUDENT_BASE = '/student'

export function previewInvitation(invitationCode, token) {
  return apiRequest(`${STUDENT_BASE}/invitations/${encodeURIComponent(invitationCode)}`, { token })
}

export function joinCourse(invitationCode, token) {
  return apiRequest(`${STUDENT_BASE}/invitations/${encodeURIComponent(invitationCode)}/join`, {
    method: 'POST',
    token,
  })
}

export function getGroupSelection(courseId, token) {
  return apiRequest(`${STUDENT_BASE}/courses/${courseId}/groups`, { token })
}

export function joinGroup(courseId, groupId, token) {
  return apiRequest(`${STUDENT_BASE}/courses/${courseId}/groups/${groupId}/join`, {
    method: 'POST',
    token,
  })
}

export function leaveGroup(courseId, token) {
  return apiRequest(`${STUDENT_BASE}/courses/${courseId}/groups/leave`, {
    method: 'DELETE',
    token,
  })
}
