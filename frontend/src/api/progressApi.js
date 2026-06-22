import { apiRequest } from './httpClient.js'

export async function getProgressDashboard(courseId, assignmentId, token) {
  const response = await apiRequest(
    `/courses/${courseId}/assignments/${assignmentId}/progress`,
    { token },
  )

  return response.data
}

export async function getFilteredProgressGroups(
  courseId,
  assignmentId,
  filter,
  token,
) {
  const searchParams = new URLSearchParams({ filter })
  const response = await apiRequest(
    `/courses/${courseId}/assignments/${assignmentId}/progress/groups?${searchParams}`,
    { token },
  )

  return response.data
}

export async function getGroupMonitoringDetails(assignmentId, groupId, token) {
  const response = await apiRequest(
    `/assignments/${assignmentId}/progress/groups/${groupId}`,
    { token },
  )

  return response.data
}
