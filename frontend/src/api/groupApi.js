import { apiRequest } from './httpClient.js'

export async function getCourseGroups(courseId, token) {
  const response = await apiRequest(`/courses/${courseId}/groups`, { token })
  return response.data
}

export async function generateGroups(courseId, request, token) {
  const response = await apiRequest(`/courses/${courseId}/groups/generate`, {
    method: 'POST',
    body: JSON.stringify(request),
    token,
  })
  return response
}

export async function updateGroupDeadline(courseId, request, token) {
  const response = await apiRequest(`/courses/${courseId}/groups/deadline`, {
    method: 'PUT',
    body: JSON.stringify(request),
    token,
  })
  return response
}

export async function removeGroupMember(courseId, groupId, groupMemberId, token) {
  const response = await apiRequest(
    `/courses/${courseId}/groups/${groupId}/members/${groupMemberId}`,
    {
      method: 'DELETE',
      token,
    },
  )
  return response
}

export async function lockAllGroups(courseId, token) {
  const response = await apiRequest(`/courses/${courseId}/groups/lock`, {
    method: 'PUT',
    token,
  })
  return response
}

export async function unlockGroups(courseId, token) {
  const response = await apiRequest(`/courses/${courseId}/groups/unlock`, {
    method: 'PUT',
    token,
  })
  return response
}
