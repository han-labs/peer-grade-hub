import { apiRequest } from './httpClient.js'

export async function getPeerReviewAssignmentPageData(assignmentId, token) {
  const response = await apiRequest(
    `/assignments/${assignmentId}/peer-review-assignments`,
    { token },
  )

  return response.data
}

export async function createPeerReviewAssignment(
  assignmentId,
  reviewerGroupId,
  targetGroupId,
  token,
) {
  const response = await apiRequest(
    `/assignments/${assignmentId}/peer-review-assignments`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        reviewerGroupId: reviewerGroupId || null,
        targetGroupId: targetGroupId || null,
      }),
    },
  )

  return response
}

export async function deletePeerReviewAssignment(peerReviewAssignmentId, token) {
  return apiRequest(`/peer-review-assignments/${peerReviewAssignmentId}`, {
    method: 'DELETE',
    token,
  })
}

export async function getReviewTask(taskId, token) {
  const response = await apiRequest(`/peer-reviews/tasks/${taskId}`, { token })
  return response.data
}

export async function getReviewTasks(token) {
  const response = await apiRequest('/peer-reviews/tasks', { token })
  return response.data
}

export async function submitReview(taskId, payload, token) {
  const response = await apiRequest(`/peer-reviews/tasks/${taskId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })
  return response
}

