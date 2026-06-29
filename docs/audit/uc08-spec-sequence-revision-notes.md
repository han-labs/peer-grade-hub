# UC-08 Monitor Progress Specification and Sequence Revision Notes

## Current Implementation Boundary

UC-08 is currently implemented as read-only monitoring:

- Lecturer-wide Monitor Progress overview: `/lecturer/progress`
- Course-level progress dashboard: `/lecturer/progress/courses/{courseId}`
- Assignment-level progress detail: `/lecturer/courses/{courseId}/assignments/{assignmentId}/progress`
- Assignment-level dashboard data endpoint: `GET /api/courses/{courseId}/assignments/{assignmentId}/progress`
- Filter endpoint: `GET /api/courses/{courseId}/assignments/{assignmentId}/progress/groups?filter={ProgressFilter}`
- Group detail endpoint: `GET /api/assignments/{assignmentId}/progress/groups/{groupId}`

Deadline extension and grade penalty are not implemented in the current code and should not be described as implemented behavior.

## Specification Revisions Needed

1. Revise the main flow to include the real three-level workflow:
   - Lecturer opens Monitor Progress.
   - System displays courses taught by the lecturer.
   - Lecturer opens a course dashboard.
   - System displays assignments in that course and available per-assignment progress.
   - Lecturer opens one assignment progress detail page.

2. Clarify scope:
   - All statistics and filters on the assignment detail page belong to one selected course and one selected assignment.
   - The overview page must not be described as global cross-course completion analytics unless the values are actually computed from real assignment-level data.

3. Split mutation behavior from read-only monitoring:
   - Keep current UC-08 as monitoring, filtering, and evidence inspection.
   - Move deadline extension and grade penalty to a future approved phase or a separate use case.

4. Define filter semantics:
   - `ALL`: every group in the selected course.
   - `INCOMPLETE`: groups with no completed submission or with incomplete assigned reviews.
   - `NOT_SUBMITTED`: no submission, `DRAFT`, or `RETURNED`.
   - `SUBMITTED`: `SUBMITTED` or `LATE`.
   - `LATE`: `LATE` submission status.
   - `NOT_REVIEWED`: at least one assigned review task is incomplete.
   - `REVIEWED`: assigned review tasks exist and all are completed.
   - `NO_RECEIVED_REVIEW`: no active incoming peer review assignment.
   - `CANCELLED` peer review assignments are excluded from review counts.

5. Clarify group formation status:
   - Current implementation shows group status per group.
   - It does not yet provide a separate overall group formation summary.

6. Clarify review evidence:
   - Current implementation displays current submission evidence, outgoing review work, and received review evidence.
   - It does not store or display a full historical audit log of review changes.

## Sequence Diagram Revisions Needed

Revise lifelines:

- `MonitorProgressView` should either remain a generic view or be split into:
  - `ProgressLandingPage`
  - `CourseProgressDashboardPage`
  - `MonitorProgressPage`
- `MonitorProgressController` -> `ProgressController`
- `MonitorProgressService` -> `ProgressService`
- `GroupDAO` -> `StudentGroupDao`
- `SubmissionDAO` -> `AssignmentSubmissionDao`
- `PeerReviewDAO` -> `PeerReviewAssignmentDao` and `PeerReviewDao`
- Add `ProgressStatisticsCalculator`
- Add `ProgressMapper` if DTO mapping is shown

Add sequence messages:

- `openMonitorProgress()`
- `loadLecturerProgressWorkspace(lecturerId)`
- `selectCourse(courseId)`
- `loadCourseProgressDashboard(courseId)`
- `selectAssignment(assignmentId)`
- `getMonitoringDashboard(courseId, assignmentId)`
- `validateLecturerRole(lecturerId)`
- `validateCourseOwnership(courseId, lecturerId)`

Keep assignment-detail messages:

- `findGroupsByCourseId(courseId)`
- `findSubmissionsByAssignmentId(assignmentId)`
- `findPeerReviewAssignmentsByAssignmentId(assignmentId)`
- `findPeerReviewsByAssignmentId(assignmentId)`
- `calculateDashboardStatistics(...)`
- `getFilteredMonitoringData(...)`
- `getGroupMonitoringDetails(...)`

Remove or mark deferred:

- `grantExtension(...)`
- `extendGroupDeadline(...)`
- `updateDeadlineExtension(...)`
- grade penalty decision/update messages

