# UC-08 Monitor Progress API Design

Status: **PROPOSED - NOT IMPLEMENTED**  
Backend context path: `/api`  
Authentication: JWT Bearer token  
Authorized actor: Lecturer who owns the selected course

This contract follows `ApiResponse` and `ErrorResponse`. It exposes DTOs only. The initial implementation recommendation is read-only dashboard, filtering, and group details because the current schema has no persistence model for group-specific extensions or grade-penalty decisions.

## Facade Entry Point

`ProgressService` is the public facade for UC-08. `ProgressController` calls this interface only. `ProgressServiceImpl` hides focused reads from `AssignmentDao`, `StudentGroupDao`, `AssignmentSubmissionDao`, `PeerReviewAssignmentDao`, `PeerReviewDao`, and `UserDao`.

## Shared Response Shapes

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-06-22T10:00:00"
}
```

Error:

```json
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Assessment data could not be loaded. Please refresh the page or try again later.",
  "path": "/api/courses/1/assignments/4/progress",
  "timestamp": "2026-06-22T10:00:00"
}
```

## Filter Values

Proposed `ProgressFilter` values:

| Value | Proposed meaning |
|---|---|
| `ALL` | All groups in the course. |
| `INCOMPLETE` | Missing/non-final submission or at least one incomplete assigned review. Whether `NO_RECEIVED_REVIEW` also belongs here needs approval. |
| `NOT_SUBMITTED` | No submission, `DRAFT`, or `RETURNED`. |
| `SUBMITTED` | `SUBMITTED` or `LATE`. |
| `LATE` | Submission status is `LATE`. |
| `NOT_REVIEWED` | At least one active outgoing peer-review assignment lacks a `SUBMITTED` review. |
| `REVIEWED` | Every active outgoing peer-review assignment has a `SUBMITTED` review and the group has at least one active outgoing task. |
| `NO_RECEIVED_REVIEW` | No active peer-review assignment targets the group. |

These definitions require approval before implementation, especially treatment of `RETURNED`, `CANCELLED`, and groups with zero outgoing tasks.

## 1. Load Monitoring Dashboard

```http
GET /api/courses/{courseId}/assignments/{assignmentId}/progress
Authorization: Bearer <lecturer-token>
```

### Authorization and Validation

- Authentication required.
- Current user must have `LECTURER` role.
- Current lecturer must own `courseId`.
- `assignmentId` must belong to `courseId`.

### Success

Status: `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "course": {
      "id": 1,
      "name": "UC14 Demo Course",
      "classCode": "UC14-DEMO-01",
      "groupFormationDeadline": "2026-06-27T16:19:55",
      "status": "ACTIVE"
    },
    "assignment": {
      "id": 4,
      "title": "Peer Assessment 1",
      "submissionDeadline": "2026-06-29T23:59:00",
      "reviewDeadline": "2026-07-06T23:59:00"
    },
    "statistics": {
      "totalGroups": 3,
      "submittedCount": 2,
      "pendingCount": 1,
      "lateCount": 1,
      "submissionCompletionRate": 66.67,
      "totalReviewAssignments": 4,
      "completedReviews": 3,
      "incompleteReviews": 1,
      "peerReviewCompletionRate": 75.00,
      "groupsWithNoReceivedReview": 1,
      "groupsWithIncompleteAssignedReviews": 1
    },
    "groups": [
      {
        "groupId": 10,
        "groupName": "Group 1",
        "groupStatus": "READY",
        "submissionStatus": "SUBMITTED",
        "submittedAt": "2026-06-29T20:15:00",
        "late": false,
        "assignedReviewCount": 2,
        "completedReviewCount": 1,
        "incompleteReviewCount": 1,
        "receivedReviewCount": 1,
        "hasReceivedReview": true
      }
    ]
  },
  "timestamp": "2026-06-22T10:00:00"
}
```

### Errors

| Status | Code | Message |
|---:|---|---|
| `401` | `UNAUTHORIZED` | `Authentication is required.` |
| `403` | `FORBIDDEN` | `You do not have permission to perform this action.` |
| `404` | `NOT_FOUND` | `The requested resource was not found.` |
| `500` | `INTERNAL_SERVER_ERROR` | `Assessment data could not be loaded. Please refresh the page or try again later.` |

The exact dashboard-load error applies to data-access/aggregation failure after authentication and ownership checks. It must not hide ordinary `401`, `403`, or `404` outcomes.

## 2. Filter Monitoring Groups

```http
GET /api/courses/{courseId}/assignments/{assignmentId}/progress/groups?filter={ProgressFilter}
Authorization: Bearer <lecturer-token>
```

`filter` defaults to `ALL`. A single query parameter adapts both sequence messages `selectIncompleteFilter(filterType)` and `selectStatusFilter(statusType)` into one stable API.

### Success

Status: `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "filter": "INCOMPLETE",
    "groups": [
      {
        "groupId": 10,
        "groupName": "Group 1",
        "groupStatus": "READY",
        "submissionStatus": "DRAFT",
        "submittedAt": null,
        "late": false,
        "assignedReviewCount": 1,
        "completedReviewCount": 0,
        "incompleteReviewCount": 1,
        "receivedReviewCount": 0,
        "hasReceivedReview": false
      }
    ]
  },
  "timestamp": "2026-06-22T10:00:00"
}
```

Invalid filter values should return `400 BAD_REQUEST` with the project's generic invalid-request message unless an exact UC-08 message is approved.

## 3. Load Group Monitoring Details

```http
GET /api/assignments/{assignmentId}/progress/groups/{groupId}
Authorization: Bearer <lecturer-token>
```

The service derives the course from the assignment and verifies lecturer ownership and group membership in that course.

### Success

Status: `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "group": {
      "id": 10,
      "name": "Group 1",
      "status": "READY"
    },
    "submission": {
      "id": 31,
      "status": "SUBMITTED",
      "submittedAt": "2026-06-29T20:15:00",
      "submittedById": 8,
      "note": "Final submission"
    },
    "outgoingReviews": [
      {
        "peerReviewAssignmentId": 40,
        "targetGroupId": 11,
        "targetGroupName": "Group 2",
        "assignmentStatus": "SUBMITTED",
        "reviewStatus": "SUBMITTED",
        "assignedAt": "2026-06-22T10:00:00",
        "dueAt": "2026-07-06T23:59:00",
        "submittedAt": "2026-07-05T18:20:00"
      }
    ],
    "receivedReviewEvidence": [
      {
        "peerReviewAssignmentId": 41,
        "reviewId": 51,
        "reviewerGroupId": 12,
        "reviewerGroupName": "Group 3",
        "status": "SUBMITTED",
        "score": 82.50,
        "comment": "Clear analysis with useful supporting evidence.",
        "submittedAt": "2026-07-05T19:10:00"
      }
    ]
  },
  "timestamp": "2026-06-22T10:00:00"
}
```

Lecturers may see reviewer-group identity according to current project role rules. Student-facing reuse of this DTO is forbidden.

### Errors

| Status | Code | Exact message |
|---:|---|---|
| `404` | `NOT_FOUND` | `Selected group no longer exists or you do not have permission to view it.` |
| `500` | `INTERNAL_SERVER_ERROR` | `Review evidence could not be displayed. Please check the assessment configuration or contact the administrator.` |

Authentication and course-ownership failures before group lookup remain the existing `401`/`403` security responses. The combined selected-group message is recommended for a missing group, a group outside the assignment course, or an inaccessible group after the course context has been authorized.

## 4. Grant Deadline Extension

Status: **BLOCKED - SCHEMA APPROVAL REQUIRED**

Reserved contract after persistence approval:

```http
PATCH /api/assignments/{assignmentId}/progress/groups/{groupId}/deadline-extension
Authorization: Bearer <lecturer-token>
Content-Type: application/json
```

```json
{
  "newDeadline": "2026-07-03T23:59:00"
}
```

Proposed success: `200 OK`

```json
{
  "success": true,
  "message": "Deadline extension applied successfully.",
  "data": {
    "assignmentId": 4,
    "groupId": 10,
    "originalDeadline": "2026-06-29T23:59:00",
    "extendedDeadline": "2026-07-03T23:59:00",
    "grantedById": 2,
    "grantedAt": "2026-06-28T09:30:00"
  },
  "timestamp": "2026-06-28T09:30:00"
}
```

Persistence/system failure must return:

`Failed to record decision due to a system error. Please try again.`

The current `assignments.submission_deadline` is global. Updating it would extend every group and would violate the sequence's group-specific operation. A new approved table or equivalent mapping is required before this endpoint can be implemented.

## 5. Apply Grade Penalty

Status: **DEFERRED - SPECIFICATION AND SCHEMA APPROVAL REQUIRED**

Candidate path only:

```http
PATCH /api/assignments/{assignmentId}/progress/groups/{groupId}/penalty
```

No request or response contract is approved because the specification does not define penalty amount/type, reason, reversibility, interaction with final grades, or audit fields. `assignment_results.score` is the official result and must not be mutated implicitly by the monitoring subsystem. Do not implement this endpoint until UC-08 and UC-09 ownership is resolved.

## Proposed DTO Inventory

### Requests

- `DeadlineExtensionRequest(newDeadline)` - blocked pending persistence approval.
- `GradePenaltyRequest` - not defined; needs approval.

### Responses

- `ProgressDashboardResponse(course, assignment, statistics, groups)`
- `CourseProgressSummaryResponse(id, name, classCode, groupFormationDeadline, status)`
- `AssignmentProgressSummaryResponse(id, title, submissionDeadline, reviewDeadline)`
- `ProgressStatisticsResponse(totalGroups, submittedCount, pendingCount, lateCount, submissionCompletionRate, totalReviewAssignments, completedReviews, incompleteReviews, peerReviewCompletionRate, groupsWithNoReceivedReview, groupsWithIncompleteAssignedReviews)`
- `GroupProgressSummaryResponse(groupId, groupName, groupStatus, submissionStatus, submittedAt, late, assignedReviewCount, completedReviewCount, incompleteReviewCount, receivedReviewCount, hasReceivedReview)`
- `FilteredProgressGroupsResponse(filter, groups)`
- `GroupMonitoringDetailResponse(group, submission, outgoingReviews, receivedReviewEvidence)`
- `MonitoredGroupResponse(id, name, status)`
- `SubmissionProgressResponse(id, status, submittedAt, submittedById, note)`
- `OutgoingReviewProgressResponse(peerReviewAssignmentId, targetGroupId, targetGroupName, assignmentStatus, reviewStatus, assignedAt, dueAt, submittedAt)`
- `ReceivedReviewEvidenceResponse(peerReviewAssignmentId, reviewId, reviewerGroupId, reviewerGroupName, status, score, comment, submittedAt)`
- `DeadlineExtensionResponse(assignmentId, groupId, originalDeadline, extendedDeadline, grantedById, grantedAt)` - blocked.
- `GradePenaltyResponse` - not defined; needs approval.

## Known Design Adaptations

1. Sequence `MonitorProgressService` becomes `ProgressService`, matching the approved facade rule.
2. Sequence `GroupDAO` maps to `StudentGroupDao`.
3. Sequence `SubmissionDAO` maps to `AssignmentSubmissionDao`.
4. Sequence `PeerReviewDAO` maps to both `PeerReviewAssignmentDao` for assigned tasks and `PeerReviewDao` for review completion/evidence.
5. A focused assignment query verifies the assignment-course-lecturer context before aggregation.
6. Filtering is represented by one `filter` query parameter instead of separate incomplete/status endpoints.
7. Authentication, lecturer role, course ownership, and assignment-course consistency are added from preconditions.
8. Deadline extension is retained as a reserved API but blocked because the current schema cannot persist a group-specific decision.
9. Grade penalty is deferred because neither sequence detail nor persistence semantics are sufficient.

## Approval Gate

The read-only endpoints can proceed after filter/statistics definitions are approved. Mutation endpoints cannot proceed safely until extension and penalty persistence, ownership, validation, and audit requirements are approved.
