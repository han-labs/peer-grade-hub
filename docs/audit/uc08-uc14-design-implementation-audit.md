# UC-08 and UC-14 Design-to-Code Mapping Audit

## 1. Executive Summary

This audit checks UC-08 Monitor Progress and UC-14 Assign Peer Review against the current PeerGrade Hub implementation, the documented architecture rule, the GRASP guide, the Facade subsystem guide, the class diagram mapping, the use case specifications, and the sequence diagrams.

Architecture rule audited:

```text
React/View -> Controller -> Service interface / Facade -> ServiceImpl -> DAO -> Database
```

Overall verdict:

| Use case | Current implementation status | Design traceability status | Main conclusion |
| --- | --- | --- | --- |
| UC-08 Monitor Progress | Implemented as read-only monitoring with lecturer overview, course-level dashboard, assignment-level dashboard, filtering, statistics, group details, and evidence display. | PASS_WITH_NOTES | The implemented read-only scope is coherent and follows the architecture. The written use case and sequence diagram still include deadline extension and penalty mutation behavior that is not implemented and should be marked deferred or split into a later use case. |
| UC-14 Assign Peer Review | Implemented for page load, create, delete, validation, warning list, status creation, and exact messages. | PASS_WITH_NOTES | The core use case is implemented well. The specification and sequence diagram should be synchronized with actual class names, DAO split, missing-auth validations, missing reviewer/target validation, and the current delete rule that blocks when any peer review record exists. |

Current verification finding:

- Backend tests now pass after adding the missing `CourseDao` read methods used by course/dashboard services.
- Frontend lint now passes after minimal student/result page lint fixes.
- Frontend production build passes.
- The design mismatch findings below remain unchanged.

## 2. Implementation File Map

### UC-08 Monitor Progress

| Layer | File/class | Important methods or purpose |
| --- | --- | --- |
| Frontend route | `frontend/src/App.jsx` | `/lecturer/progress`, `/lecturer/progress/courses/:courseId`, `/lecturer/courses/:courseId/assignments/:assignmentId/progress` |
| Frontend overview view | `frontend/src/pages/ProgressLandingPage.jsx` | Lecturer-wide progress landing page using real course/workspace data. |
| Frontend course view | `frontend/src/pages/CourseProgressDashboardPage.jsx` | Course-level dashboard; loads assignments and per-assignment progress where available. |
| Frontend assignment view | `frontend/src/pages/MonitorProgressPage.jsx` | Assignment-level progress dashboard, filters, attention summary, group table, detail panel. |
| Frontend detail component | `frontend/src/components/progress/GroupDetailPanel.jsx` | Shows group submission, outgoing review work, received review evidence, and deferred action area. |
| Frontend API | `frontend/src/api/progressApi.js` | `getProgressDashboard`, `getFilteredProgressGroups`, `getGroupMonitoringDetails`. |
| Frontend workspace API | `frontend/src/api/progressWorkspaceApi.js` | Course/assignment selection data for the progress workflow. |
| Controller | `backend/src/main/java/edu/hcmute/peergradehub/controller/progress/ProgressController.java` | `getMonitoringDashboard`, `getFilteredMonitoringGroups`, `getGroupMonitoringDetails`. |
| Service facade | `backend/src/main/java/edu/hcmute/peergradehub/service/ProgressService.java` | Facade for UC-08 backend operations. |
| Service implementation | `backend/src/main/java/edu/hcmute/peergradehub/service/impl/ProgressServiceImpl.java` | Lecturer validation, course ownership validation, DAO orchestration, exception mapping. |
| Mapper | `backend/src/main/java/edu/hcmute/peergradehub/mapper/ProgressMapper.java` | Entity/list data to progress DTOs. |
| Calculator | `backend/src/main/java/edu/hcmute/peergradehub/service/support/ProgressStatisticsCalculator.java` | Statistics and filter semantics. |
| Enum | `backend/src/main/java/edu/hcmute/peergradehub/enumeration/ProgressFilter.java` | `ALL`, `INCOMPLETE`, `NOT_SUBMITTED`, `SUBMITTED`, `LATE`, `NOT_REVIEWED`, `REVIEWED`, `NO_RECEIVED_REVIEW`. |
| DTOs | `backend/src/main/java/edu/hcmute/peergradehub/dto/response/progress/*` | Dashboard, statistics, group summary, group detail, submission, outgoing review, received evidence responses. |
| DAOs | `AssignmentDao`, `StudentGroupDao`, `AssignmentSubmissionDao`, `PeerReviewAssignmentDao`, `PeerReviewDao`, `UserDao` | Focused data reads used by the UC-08 facade. |
| Tests | `backend/src/test/java/edu/hcmute/peergradehub/progress/*` | Service, controller integration, and statistics calculator tests. |

### UC-14 Assign Peer Review

| Layer | File/class | Important methods or purpose |
| --- | --- | --- |
| Frontend route | `frontend/src/App.jsx` | `/lecturer/assignments/:assignmentId/peer-review-assignments`. |
| Frontend view | `frontend/src/pages/AssignPeerReviewPage.jsx` | Assignment summary, reviewer/target selects, create/delete, warnings, messages, restricted state. |
| Frontend API | `frontend/src/api/peerReviewAssignmentApi.js` | `getPeerReviewAssignmentPageData`, `createPeerReviewAssignment`, `deletePeerReviewAssignment`. |
| Controller | `backend/src/main/java/edu/hcmute/peergradehub/controller/peerreview/PeerReviewAssignmentController.java` | GET page data, POST create, DELETE task. |
| Service facade | `backend/src/main/java/edu/hcmute/peergradehub/service/PeerReviewAssignmentService.java` | Facade for UC-14 backend operations. |
| Service implementation | `backend/src/main/java/edu/hcmute/peergradehub/service/impl/PeerReviewAssignmentServiceImpl.java` | Lecturer validation, ownership, create/delete rules, exact exception messages. |
| Mapper | `backend/src/main/java/edu/hcmute/peergradehub/mapper/PeerReviewAssignmentMapper.java` | Assignment/group/task DTO mapping. |
| Request DTO | `backend/src/main/java/edu/hcmute/peergradehub/dto/request/peerreview/CreatePeerReviewAssignmentRequest.java` | `reviewerGroupId`, `targetGroupId`. |
| Response DTOs | `backend/src/main/java/edu/hcmute/peergradehub/dto/response/peerreview/*` | Page response, assignment summary, group option, task response, delete response. |
| DAOs | `AssignmentDao`, `StudentGroupDao`, `PeerReviewAssignmentDao`, `PeerReviewDao`, `UserDao` | Assignment context, groups, duplicate lookup, delete guard, actor lookup. |
| Entities/helpers | `Assignment.isReviewOpen`, `PeerReviewAssignment.isSelfReview` | Domain-local rules used by the service. |
| Tests | `backend/src/test/java/edu/hcmute/peergradehub/peerreview/*PeerReviewAssignment*` | Service and controller integration tests for UC-14. |

## 3. Class Diagram Mapping Audit

| Design class/entity | Implemented Java class/entity/DTO/DAO/service | Table | Responsibility | Status | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| User | `User`, `UserDao`, auth principal classes | `app_users` | Actor identity, lecturer/student/admin role, status. | MATCH | `UserDao`; `ProgressServiceImpl.requireLecturer`; `PeerReviewAssignmentServiceImpl.requireLecturer`. | Keep `app_users` naming documented as intentional. |
| UserRole | `UserRole` enum | `app_users.user_role` | Role check for lecturer-only UC-08/UC-14. | MATCH | Services compare against `UserRole.LECTURER`. | No change. |
| Course | `Course`, `CourseDao` | `courses` | Course/class context and lecturer ownership. | MATCH | `AssignmentDao.findByIdWithCourseAndLecturer`; course lecturer checks. | Sequence diagrams should include ownership validation. |
| StudentGroup | `StudentGroup`, `StudentGroupDao` | `student_groups` | Course groups, group status, reviewer/target groups. | MATCH | `findByCourseId`, `findByIdAndCourseId`; DTO group options/summaries. | No change. |
| GroupMember | `GroupMember`, `GroupMemberDao` | `group_members` | Explicit join entity for group membership. | ACCEPTABLE ADAPTATION | Foundation mapping replaces direct list with join entity. | Keep as design-to-code adaptation. |
| Lesson | `Lesson`, `LessonDao` | `lessons` | Assignment belongs to a lesson, lesson belongs to course. | MATCH | `Assignment.lesson.course` path and course workspace APIs. | No change. |
| Assignment | `Assignment`, `AssignmentDao` | `assignments` | Selected assessment; submission/review deadlines. | MATCH | `findByIdWithCourseAndLecturer`; `isReviewOpen`. | Add sequence note that assignment context includes course/lecturer. |
| AssignmentSubmission | `AssignmentSubmission`, `AssignmentSubmissionDao` | `assignment_submissions` | Group submission status/evidence for UC-08. | ACCEPTABLE ADAPTATION | Added from SRS; used by progress dashboard/details. | Class diagram/spec should acknowledge as SRS extension. |
| PeerReviewAssignment | `PeerReviewAssignment`, `PeerReviewAssignmentDao`, `PeerReviewAssignmentService` | `peer_review_assignments` | Reviewer-target task for UC-14 and monitoring for UC-08. | MATCH | Unique pair constraint, service create/delete, status `ASSIGNED`. | Rename generic sequence `PeerReviewDAO` to include this DAO. |
| PeerReview | `PeerReview`, `PeerReviewDao` | `peer_reviews` | Actual review evidence/status/score/comment. | MATCH | UC-08 evidence and completion checks; UC-14 delete guard. | Sequence should distinguish task assignment from submitted review. |
| AssignmentResult | `AssignmentResult`, `AssignmentResultDao` | `assignment_results` | Final grades/results; not central to UC-08/UC-14 except evidence for later grading. | MATCH | Foundation schema and DAO. | Not required in UC-08/UC-14 sequence except future grade penalty/final grading. |
| ResultAppeal | `ResultAppeal`, `ResultAppealDao` | `result_appeals` | Appeal foundation; not used in UC-08/UC-14. | MATCH, NOT_USED_HERE | Foundation schema. | Leave out of UC-08/UC-14 sequence unless UC-11/UC-12 are discussed. |
| DAO/repository abstraction | Spring Data DAO interfaces | N/A | Persistence queries. | MATCH | Controllers do not call DAOs; services call DAOs. | Keep DAO names specific in revised sequence diagrams. |
| Service/facade abstraction | `ProgressService`, `PeerReviewAssignmentService` | N/A | Public subsystem entry point from controllers. | MATCH | Controllers inject service interfaces. | Keep service interfaces as Facade pattern evidence. |

## 4. GRASP Compliance Audit

### UC-08 Monitor Progress

| GRASP pattern | Status | Evidence | Why it passes or needs notes | Recommendation |
| --- | --- | --- | --- | --- |
| Controller | PASS | `ProgressController.getMonitoringDashboard`, `getFilteredMonitoringGroups`, `getGroupMonitoringDetails`. | Controller extracts path/query/current user and delegates to `ProgressService`; no DAO access or statistics logic. | No change. |
| Expert | PASS_WITH_NOTES | `ProgressStatisticsCalculator.calculate`, `filter`; `ProgressServiceImpl.requireOwnedAssignment`. | Statistic/filter expert is a focused calculator. Service owns cross-record validation because it needs User, Assignment, Course, Group, Submission, PeerReview data. Some ownership checks still traverse `assignment.lesson.course`, but via focused entity graph. | If the model grows, consider focused projection/query service for ownership context. |
| Creator | PASS | `ProgressMapper` creates DTOs; calculator creates statistics/group summaries. | DTO creation is not done in controller; entities are not exposed as API responses. | No change. |
| High Cohesion | PASS_WITH_NOTES | `ProgressServiceImpl` orchestrates monitoring only; mapper/calculator split support work. | UC-08 naturally aggregates several subsystems. The service remains read-only and cohesive to monitoring. | Do not add mutation decisions here without separate methods and schema approval. |
| Low Coupling | PASS_WITH_NOTES | Controller depends on `ProgressService`; service depends on DAOs, mapper, calculator. | No Controller -> DAO or Controller -> Database path. Service uses several DAOs, which is acceptable for a reporting facade. | Add projection DAOs later if performance/N+1 becomes an issue. |

### UC-14 Assign Peer Review

| GRASP pattern | Status | Evidence | Why it passes or needs notes | Recommendation |
| --- | --- | --- | --- | --- |
| Controller | PASS | `PeerReviewAssignmentController` GET/POST/DELETE methods. | Controller extracts user ID, delegates to service, returns `ApiResponse`; no business validation. | Add `allowedRoles` on the frontend route later for consistency, but backend is correct. |
| Expert | PASS | `Assignment.isReviewOpen`, `PeerReviewAssignment.isSelfReview`, service duplicate/course validations. | Entity helpers answer simple state-local questions. Service handles cross-entity rules requiring DAOs. | No change. |
| Creator | PASS | `PeerReviewAssignmentServiceImpl.createPeerReviewAssignment`; `PeerReviewAssignmentMapper`. | Service creates the peer review task from validated aggregate data; mapper creates DTOs. | No change. |
| High Cohesion | PASS | Service is focused on assignment task page/create/delete. | UC-14 responsibilities are not mixed with UC-07 peer review submission logic. | Keep UC-07 submission access separate. |
| Low Coupling | PASS_WITH_NOTES | Controller uses service interface; service uses focused DAOs. | No Controller -> DAO. DAO split is clear. Service catches duplicate persistence constraint. | Consider adding explicit tests for multiple reviewers/targets if not already added. |

## 5. Facade Compliance Audit

| Use case | Facade interface | Facade methods | Hidden subsystem | Clients | Status | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| UC-08 | `ProgressService` | `getMonitoringDashboard`, `getFilteredMonitoringGroups`, `getGroupMonitoringDetails` | `AssignmentDao`, `StudentGroupDao`, `AssignmentSubmissionDao`, `PeerReviewAssignmentDao`, `PeerReviewDao`, `UserDao`, `ProgressMapper`, `ProgressStatisticsCalculator` | `ProgressController` | PASS_WITH_NOTES | Keep as the public backend facade. Add frontend overview/course-level navigation to revised sequence documentation because those pages are now part of the real workflow. |
| UC-14 | `PeerReviewAssignmentService` | `getAssignPeerReviewPageData`, `createPeerReviewAssignment`, `deletePeerReviewAssignment` | `AssignmentDao`, `StudentGroupDao`, `PeerReviewAssignmentDao`, `PeerReviewDao`, `UserDao`, mapper, domain helpers | `PeerReviewAssignmentController` | PASS | Use this class name in the sequence diagram instead of generic `PeerReviewService`. |

Facade conclusion:

- The project does not need decorative `*Facade` wrappers. The service interfaces already satisfy the Facade Pattern under the project rule.
- The revised sequence diagrams should show controllers calling service interfaces/facades, not service implementations or DAOs directly.

## 6. UC-08 Specification Conformance Matrix

### FR-07 Functional Requirements

| Requirement | Implemented evidence | Status | Recommendation |
| --- | --- | --- | --- |
| View overall status of group formations. | Group list includes `groupStatus`; dashboard counts all groups. | PARTIAL | Revise wording to "view group status per group" or add a separate group formation summary later. |
| View assignment submission completion status. | `ProgressStatisticsResponse` submitted/pending/late/rate; group table. | MATCH | Keep. |
| View peer review assignment and completion status. | total/incomplete/completed review assignments; outgoing/received evidence. | MATCH | Keep. |
| Highlight missing submissions, incomplete peer reviews, and groups without received reviews. | filters and attention counts; UI attention indicators. | MATCH | Keep. |
| Support filtering by not submitted, submitted, not reviewed, reviewed, no received review. | `ProgressFilter` and controller query param. | MATCH | Keep. |

### UC-08 Flow and Exceptions

| Spec item | Implemented endpoint/UI/method | Status | Explanation | Recommendation |
| --- | --- | --- | --- | --- |
| Actor opens course monitoring page and selects assignment. | `/lecturer/progress` -> `/lecturer/progress/courses/:courseId` -> `/lecturer/courses/:courseId/assignments/:assignmentId/progress`. | IMPLEMENTED_DIFFERENTLY | Implementation adds a useful three-level workflow before assignment-level monitoring. | Update use case main flow to include lecturer-wide overview and course-level dashboard. |
| System loads group formation, submissions, peer reviews, statistics. | `ProgressServiceImpl.loadDashboardData`; `ProgressStatisticsCalculator`. | MATCH | Data comes from groups, submissions, peer review assignments/reviews. | Keep. |
| Actor reviews dashboard statistics and filters/selects group. | `MonitorProgressPage` filter chips and group table; group detail panel. | MATCH | User can filter and inspect groups. | Keep. |
| Actor decides on extension or penalty. | No mutation endpoints; deferred UI only. | OUT_OF_SCOPE_CURRENT_PHASE | Current implementation is read-only monitoring. | Split into later UC-08B or mark extension/penalty deferred pending schema. |
| System applies extension/penalty and records timestamp. | Not implemented. | NOT_IMPLEMENTED | No schema/API endpoint for this phase. | Remove from current implemented UC or add future implementation backlog. |
| Alternate 3a filter incomplete tasks. | `INCOMPLETE` filter. | MATCH | Maps to not submitted OR incomplete assigned reviews. | Keep and document exact semantics. |
| Alternate 3b filter by status. | `NOT_SUBMITTED`, `SUBMITTED`, `LATE`, `NOT_REVIEWED`, `REVIEWED`, `NO_RECEIVED_REVIEW`. | MATCH | Includes `LATE` as extra useful filter. | Update spec to include `LATE` if desired. |
| Exception 2.1 dashboard data cannot be loaded. | `DASHBOARD_LOAD_ERROR_MESSAGE`; service catches `DataAccessException`. | PARTIAL | Exact message exists for DAO/data-access failures; other runtime mapping/calculation failures may become generic errors. | Either keep as data-access exception only or broaden error wrapping later. |
| Exception 3.1 selected group inaccessible. | `GROUP_NOT_ACCESSIBLE_MESSAGE`. | MATCH | Exact message used by service/tests. | Keep. |
| Exception 4.1 review evidence cannot be displayed. | `REVIEW_EVIDENCE_ERROR_MESSAGE`. | MATCH_WITH_NOTES | DAO/config evidence failures map exactly; empty evidence returns success. | Keep. |

## 7. UC-14 Specification Conformance Matrix

### FR-11 Functional Requirements

| Requirement | Implemented evidence | Status | Recommendation |
| --- | --- | --- | --- |
| Lecturer selects reviewer group and target group for same assignment. | POST request DTO; service validates IDs and course. | MATCH | Keep. |
| Prevent self-review. | `PeerReviewAssignment.isSelfReview`; exact message. | MATCH | Keep. |
| Prevent duplicate reviewer-target pair for same assignment. | DAO duplicate lookup and DB unique constraint. | MATCH | Keep. |
| Allow one target to receive reviews from multiple reviewers. | Unique constraint is only `(assignment, reviewer, reviewee)`. | MATCH | Add explicit test if missing. |
| Allow one reviewer to review multiple target groups. | Same unique-pair rule allows this. | MATCH | Add explicit test if missing. |
| Add or modify peer review assignments before deadline. | Add/create implemented; modify/update not implemented. | PARTIAL | Revise current spec to "add/delete" or add future PUT/PATCH implementation. |
| Prevent deleting after peer review submitted. | Delete blocked when any `PeerReview` record exists. | IMPLEMENTED_DIFFERENTLY | Current implementation is stricter than spec and blocks DRAFT too. Update spec to "after review record/evidence exists" or change implementation later. |
| Display warnings for target groups without received peer review assignment. | Page response includes `groupsWithoutReceivedReviews`; frontend displays warning. | MATCH | Keep. |
| Update peer review task status for monitoring. | New task has `ASSIGNED`; UC-08 reads assignment/review status. | PARTIAL | Status lifecycle beyond create belongs to UC-07. Revise wording to "creates task with ASSIGNED status." |

### UC-14 Flow and Exceptions

| Spec item | Implemented endpoint/UI/method | Status | Explanation | Recommendation |
| --- | --- | --- | --- | --- |
| Open assignment and click Assign Peer Review. | Frontend route `/lecturer/assignments/:assignmentId/peer-review-assignments`. | MATCH | Route is direct and dashboard links can navigate there. | Keep. |
| System displays assignment info, deadline, groups, pairs, warnings. | GET endpoint and `AssignPeerReviewPage`. | MATCH | DTOs avoid exposing entities. | Keep. |
| Actor selects reviewer and target, clicks Assign. | UI selects; POST request. | MATCH | UI prevents obvious self-target selection but backend is authoritative. | Keep. |
| System validates selected groups, course, self-review, deadline, duplicate. | `PeerReviewAssignmentServiceImpl.createPeerReviewAssignment`. | MATCH | Exact messages for expected cases. | Keep. |
| System saves task with status Assigned and updates list/warnings. | Entity saved with `ASSIGNED`; frontend reloads page data. | MATCH | `dueAt` is copied from assignment review deadline. | Keep. |
| Multiple reviewers per target. | Allowed by implementation and DB. | MATCH | Add explicit automated test if desired. |
| One reviewer reviews multiple targets. | Allowed by implementation and DB. | MATCH | Add explicit automated test if desired. |
| Add another assignment. | UI remains usable after success. | MATCH | Keep. |
| Delete before review submission. | DELETE endpoint. | IMPLEMENTED_DIFFERENTLY | It deletes only when no `PeerReview` record exists. | Revise spec/sequence or loosen implementation in a later phase. |
| Missing reviewer/target message. | Service throws exact message. | MATCH | Sequence diagram should add this validation branch. |
| Self-review message. | Exact message. | MATCH | Keep. |
| Duplicate pair message. | Exact message. | MATCH | Keep. |
| Group not in course message. | Exact message. | MATCH | Keep. |
| Deadline passed message. | Exact message. | MATCH | Keep. |
| Save/system error message. | DataAccessException maps to exact save message. | MATCH | Keep. |
| Delete blocked message. | Exact message used when any `PeerReview` exists. | IMPLEMENTED_DIFFERENTLY | Message says submitted, implementation blocks DRAFT too. Decide spec wording or implementation later. |
| Reviewer group can access target submission during review period. | Implemented in UC-07 peer review task/detail flow, not UC-14. | OUT_OF_SCOPE_CURRENT_PHASE | Move this postcondition to UC-07 or state that UC-14 only creates the task. |

## 8. UC-08 Sequence-to-Code Comparison

| Sequence lifeline/message | Actual class/method/API | Status | Explanation |
| --- | --- | --- | --- |
| `Lecturer` | Authenticated `CustomUserPrincipal` user with `LECTURER` role. | ACCEPTABLE_RENAME | Authentication is implicit in diagram but explicit in code/security. |
| `MonitorProgressView` | `ProgressLandingPage`, `CourseProgressDashboardPage`, `MonitorProgressPage`. | SHOULD_REVISE_DIAGRAM | Current frontend is three-level, not one view only. |
| `MonitorProgressController` | `ProgressController`. | ACCEPTABLE_RENAME | Controller name is shorter but same responsibility. |
| `MonitorProgressService` | `ProgressService` / `ProgressServiceImpl`. | ACCEPTABLE_RENAME | Service interface is the facade. |
| `GroupDAO` | `StudentGroupDao`. | ACCEPTABLE_RENAME | Existing domain class is `StudentGroup`. |
| `SubmissionDAO` | `AssignmentSubmissionDao`. | ACCEPTABLE_RENAME | More specific DAO name. |
| `PeerReviewDAO` | `PeerReviewAssignmentDao` and `PeerReviewDao`. | SHOULD_REVISE_DIAGRAM | Implementation separates task assignment records from review evidence records. |
| `selectAssignmentToMonitor(courseId, assignmentId)` | Frontend navigation from course dashboard to assignment detail. | MATCH_WITH_NOTES | Current user flow adds overview/course selection before this. |
| `getMonitoringDashboard(courseId, assignmentId)` | `GET /courses/{courseId}/assignments/{assignmentId}/progress`. | MATCH | Implemented. |
| `loadMonitoringData(courseId, assignmentId)` | `ProgressServiceImpl.getMonitoringDashboard`. | MATCH | Implemented. |
| `findGroupsByCourseId(courseId)` | `StudentGroupDao.findByCourseId`. | MATCH | Implemented. |
| `findSubmissionsByAssignmentId(assignmentId)` | `AssignmentSubmissionDao.findByAssignmentId`. | MATCH | Implemented. |
| `findPeerReviewsByAssignmentId(assignmentId)` | `PeerReviewAssignmentDao.findByAssignmentId` plus `PeerReviewDao.findByAssignmentId`. | SHOULD_REVISE_DIAGRAM | Diagram should show both assignment tasks and evidence. |
| `calculateDashboardStatistics(...)` | `ProgressStatisticsCalculator.calculate`. | MATCH | Implemented as dedicated support class. |
| Filter incomplete/status messages | `GET /progress/groups?filter=...`; calculator `filter`. | MATCH | Implemented. |
| Group detail messages | `GET /assignments/{assignmentId}/progress/groups/{groupId}`. | MATCH | Implemented. |
| Review evidence failure | `ProgressServiceImpl` exact message for data access failure. | MATCH_WITH_NOTES | Empty evidence is not an error. |
| Deadline extension messages | Not implemented. | MISSING / DEFERRED | Sequence must mark this opt block as deferred or remove it from current diagram. |
| Penalty decision | Not implemented. | MISSING / DEFERRED | Current sequence barely models penalty; spec should split it out. |

## 9. UC-14 Sequence-to-Code Comparison

| Sequence lifeline/message | Actual class/method/API | Status | Explanation |
| --- | --- | --- | --- |
| `Lecturer` | Authenticated user with `LECTURER` role. | ACCEPTABLE_RENAME | Auth/role is implicit in sequence but explicit in service. |
| `AssignPeerReviewView` | `AssignPeerReviewPage`. | ACCEPTABLE_RENAME | Implemented. |
| `PeerReviewController` | `PeerReviewAssignmentController`. | SHOULD_REVISE_DIAGRAM | Actual controller is more precise. |
| `PeerReviewService` | `PeerReviewAssignmentService`. | SHOULD_REVISE_DIAGRAM | Actual facade is the assignment-task service. |
| `AssignmentDAO` | `AssignmentDao.findByIdWithCourseAndLecturer`. | ACCEPTABLE_RENAME | Implemented with context fetch. |
| `GroupDAO` | `StudentGroupDao`. | ACCEPTABLE_RENAME | Implemented. |
| `PeerReviewDAO` | `PeerReviewAssignmentDao` plus `PeerReviewDao`. | SHOULD_REVISE_DIAGRAM | Delete guard uses actual review evidence DAO. |
| `getAssignPeerReviewPage(assignmentId)` | `GET /assignments/{assignmentId}/peer-review-assignments`. | MATCH | Implemented. |
| `loadAssignPeerReviewData(assignmentId)` | `getAssignPeerReviewPageData`. | MATCH | Implemented. |
| `findAssignmentById`, `findGroupsByCourseId`, `findPeerReviewAssignmentsByAssignmentId` | DAO calls in service. | MATCH | Implemented. |
| Missing reviewer/target validation | Service validates request IDs. | EXTRA_IMPLEMENTED | Sequence diagram should add this exception branch. |
| Self-review validation | `PeerReviewAssignment.isSelfReview`. | MATCH | Implemented. |
| Group-in-course validation | `StudentGroupDao.findByIdAndCourseId`; exact message. | MATCH | Implemented. |
| Deadline validation | `Assignment.isReviewOpen`. | MATCH | Implemented. |
| Duplicate validation | `PeerReviewAssignmentDao.findByAssignmentIdAndReviewerGroupIdAndRevieweeGroupId`; DB constraint. | MATCH | Implemented. |
| `savePeerReviewAssignment` | `peerReviewAssignmentDao.saveAndFlush`. | MATCH | Implemented. |
| `deletePeerReviewAssignment` / `removePeerReviewAssignment` | DELETE endpoint; service method. | MATCH_WITH_NOTES | Implemented, but block rule is stricter than spec. |
| `hasSubmittedReview(peerReviewAssignmentId)` | `PeerReviewDao.existsByPeerReviewAssignmentId`. | IMPLEMENTED_DIFFERENTLY | The method checks any review record, not only submitted status. |
| Delete success response | Exact API message. | MATCH | Implemented. |

## 10. Strict Test Results

### Automated commands run

| Command | Result | Notes |
| --- | --- | --- |
| `backend/.\\mvnw.cmd clean test` | PASS | 113 tests run, 0 failures, 0 errors, 0 skipped. |
| `frontend/npm run lint` | PASS | ESLint completed with no reported problems. |
| `frontend/npm run build` | PASS | Vite production build completed successfully. |

Resolved readiness blockers:

| Area | Fix |
| --- | --- |
| Backend | Added focused `CourseDao` methods for active student courses, course-status counts, lecturer active-course counts, and recent courses. |
| Frontend | Removed an unused result prop and moved student page loading resets out of direct synchronous effect-body state updates. |

### UC-14 required test cases

| Test case | Evidence | Status |
| --- | --- | --- |
| Lecturer loads assignment peer review page. | Controller integration test covers GET page data. | VERIFIED_BY_CODE_REVIEW_AND_TEST_FILE |
| Create valid reviewer-target pair. | Controller integration test expects `201` and exact success message. | VERIFIED_BY_CODE_REVIEW_AND_TEST_FILE |
| Missing reviewer/target exact error. | Service tests cover missing reviewer, missing target, both missing. | VERIFIED_BY_TEST_FILE |
| Self-review exact error. | Service and controller tests cover self-review. | VERIFIED_BY_TEST_FILE |
| Duplicate exact error. | Service tests cover duplicate lookup and duplicate constraint. | VERIFIED_BY_TEST_FILE |
| Group from another course exact error. | Service tests cover reviewer/target outside course. | VERIFIED_BY_TEST_FILE |
| Deadline passed exact error. | Service test covers deadline passed. | VERIFIED_BY_TEST_FILE |
| Multiple reviewers same target allowed. | Implied by unique pair constraint and no target-only unique rule. | VERIFIED_BY_CODE_REVIEW; ADD_EXPLICIT_TEST_RECOMMENDED |
| One reviewer multiple targets allowed. | Implied by unique pair constraint and no reviewer-only unique rule. | VERIFIED_BY_CODE_REVIEW; ADD_EXPLICIT_TEST_RECOMMENDED |
| Delete with no review succeeds. | Service and controller tests cover delete success. | VERIFIED_BY_TEST_FILE |
| Delete blocked when review exists/submitted. | Tests block when a DRAFT review exists. | VERIFIED_BY_TEST_FILE; SPEC_MISMATCH |
| Student forbidden. | Controller tests cover non-lecturer/student forbidden. | VERIFIED_BY_TEST_FILE |
| Unauthorized. | Controller test covers unauthorized. | VERIFIED_BY_TEST_FILE |
| Not-owned lecturer course forbidden. | Service/controller tests cover different lecturer forbidden. | VERIFIED_BY_TEST_FILE |

### UC-08 required test cases

| Test case | Evidence | Status |
| --- | --- | --- |
| Lecturer loads monitor overview. | Frontend implementation exists; backend tests focus assignment-level endpoint. | VERIFIED_BY_CODE_REVIEW; MANUAL_BROWSER_NOT_RUN |
| Lecturer opens course-level dashboard. | Frontend implementation exists; calls real workspace/progress APIs. | VERIFIED_BY_CODE_REVIEW; MANUAL_BROWSER_NOT_RUN |
| Lecturer loads assignment-level dashboard. | Controller integration test covers dashboard endpoint. | VERIFIED_BY_TEST_FILE |
| Dashboard stats correct. | Controller and calculator tests assert expected counts and rates. | VERIFIED_BY_TEST_FILE |
| ALL filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| INCOMPLETE filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| NOT_SUBMITTED filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| SUBMITTED filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| LATE filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| NOT_REVIEWED filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| REVIEWED filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| NO_RECEIVED_REVIEW filter. | Calculator/controller tests. | VERIFIED_BY_TEST_FILE |
| Group detail loads evidence. | Controller integration test covers submission, outgoing review, evidence. | VERIFIED_BY_TEST_FILE |
| Missing/inaccessible group exact error. | Service/controller tests cover exact message. | VERIFIED_BY_TEST_FILE |
| Student forbidden. | Controller tests cover non-lecturer forbidden. | VERIFIED_BY_TEST_FILE |
| Unauthorized. | Controller tests cover JSON 401. | VERIFIED_BY_TEST_FILE |
| Not-owned lecturer course forbidden. | Service/controller tests cover different lecturer forbidden. | VERIFIED_BY_TEST_FILE |

The full backend and frontend verification commands now pass. The test-file evidence above can be treated as current passing-suite evidence for the implemented UC-08 and UC-14 scope.

## 11. Required Specification Revisions

### UC-08

1. Split UC-08 into implemented read-only monitoring and deferred decision mutations:
   - Current implemented scope: monitor progress, filter groups, inspect evidence.
   - Deferred scope: grant deadline extension, apply grade penalty, record timestamp.
2. Update main flow step 1 to match the real three-level workflow:
   - Lecturer opens Monitor Progress overview.
   - Lecturer selects a course.
   - Lecturer selects an assignment.
   - System opens assignment-level progress dashboard.
3. Change "overall status of group formations" to either:
   - "group status per group is displayed", or
   - add a future requirement for a course-level group formation summary.
4. Define filter semantics:
   - `INCOMPLETE` = not submitted OR incomplete assigned review.
   - `NO_RECEIVED_REVIEW` is separate from `INCOMPLETE`.
   - `SUBMITTED` includes `SUBMITTED` and `LATE`.
   - `RETURNED` counts as incomplete.
   - `CANCELLED` peer review assignments are excluded.
5. Clarify "review history":
   - Current implementation shows current outgoing review work and received evidence, not an audit-history table.
6. Keep exact exception messages but clarify that dashboard-load and evidence-load messages are used for data access/configuration failures.

### UC-14

1. Rename implementation actors/classes in the design:
   - `PeerReviewAssignmentController`
   - `PeerReviewAssignmentService`
   - `PeerReviewAssignmentDao`
   - `PeerReviewDao` for submitted/evidence existence guard.
2. Add missing reviewer/target validation to the sequence diagram before self-review/course/deadline checks.
3. Add authentication, lecturer-role, and lecturer-course-ownership validation to the use case and sequence diagram.
4. Revise delete rule:
   - Current implementation: cannot delete when any `PeerReview` record exists for the task.
   - Current spec: cannot delete after submitted review.
   - Recommended for current code: revise to "cannot delete once review evidence/record exists" or document stricter MVP rule.
5. Mark "modify peer review assignment before deadline" as deferred unless a PUT/PATCH update endpoint is implemented later.
6. Move "reviewer group can access target submission" to UC-07 Submit Peer Review, or state that UC-14 only creates the assignment task needed by UC-07.

## 12. Required Sequence Diagram Revisions

### UC-08

Revise lifelines:

- `MonitorProgressView` -> optionally split into `ProgressLandingPage`, `CourseProgressDashboardPage`, and `MonitorProgressPage`.
- `MonitorProgressController` -> `ProgressController`.
- `MonitorProgressService` -> `ProgressService`.
- `GroupDAO` -> `StudentGroupDao`.
- `SubmissionDAO` -> `AssignmentSubmissionDao`.
- `PeerReviewDAO` -> `PeerReviewAssignmentDao` plus `PeerReviewDao`.
- Add `ProgressStatisticsCalculator`.
- Add `ProgressMapper` if DTO mapping is shown.

Revise messages:

- Add lecturer overview and course-level navigation before assignment-level `getMonitoringDashboard`.
- Add auth/role/ownership validation before loading data.
- Keep dashboard/filter/group-detail messages.
- Mark deadline extension and penalty opt blocks as deferred, or remove from the current implemented sequence.

### UC-14

Revise lifelines:

- `PeerReviewController` -> `PeerReviewAssignmentController`.
- `PeerReviewService` -> `PeerReviewAssignmentService`.
- `PeerReviewDAO` -> `PeerReviewAssignmentDao` plus `PeerReviewDao`.
- Add `Auth/Security` or a validation note for current lecturer identity and course ownership.

Revise messages:

- Add `validateCurrentLecturer(lecturerId)`.
- Add `validateCourseOwnership(assignmentId, lecturerId)`.
- Add missing reviewer/target validation branch.
- Keep self-review, course membership, deadline, duplicate, save error branches.
- Change `hasSubmittedReview(peerReviewAssignmentId)` to `existsReviewForAssignment(peerReviewAssignmentId)` if the current stricter rule is accepted.
- Add warning-list computation after load/create/delete if the UI refresh behavior is shown.

## 13. Optional Future Implementation Backlog

| Item | Use case | Priority | Reason |
| --- | --- | --- | --- |
| Update stale API docs that still say `PROPOSED - NOT IMPLEMENTED`. | UC-08, UC-14 | MEDIUM | Docs conflict with implemented code. |
| Add explicit UC-14 tests for multiple reviewers per target and one reviewer multiple targets. | UC-14 | MEDIUM | Behavior is allowed by constraints but should be directly defended. |
| Decide UC-14 delete rule: any review record vs submitted review only. | UC-14 | HIGH for spec sync | Current implementation is stricter than written spec. |
| Add deadline extension schema/API or remove from implemented UC-08 spec. | UC-08 | HIGH for design sync | Current use case includes mutations not implemented. |
| Add grade penalty schema/API or remove from implemented UC-08 spec. | UC-08 | HIGH for design sync | Current use case includes mutations not implemented. |
| Add course-level group formation summary if required by FR-07. | UC-08 | LOW/MEDIUM | Current UI shows group statuses but not a separate formation summary. |
| Add frontend `allowedRoles={['LECTURER']}` to UC-14 route for consistency. | UC-14 | LOW | Page/backend restrict access already, but route convention is inconsistent. |
