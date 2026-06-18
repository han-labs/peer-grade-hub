# PeerGrade Hub Design-to-Code Mapping Audit

Audit date: 2026-06-18  
Audit type: Read-only design/code traceability audit  
Overall verdict: **PASS_WITH_NOTES**

Evidence inspected:

- `.agent/references/Nhom03_FinalProjectReport.docx`
- `.agent/references/Sequence_Diagram-1.Login.drawio.png`
- `docs/mapping/class-diagram-to-jpa.md`
- `.agent/plans/class-diagram-reading-and-mapping.md`
- `.agent/plans/phase-2b-approved-decisions.md`
- `.agent/plans/uc01-login-trace-plan.md`
- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `backend/src/main/resources/db/migration/V2__seed_demo_users.sql`
- Current backend source and tests
- `docs/api/auth-login.md`

The editable `.agent/references/Sequence_Diagram-1.Login.drawio` source was not found. Only the PNG export was available. Any conclusion that would require inspecting editable Draw.io metadata is marked **NEEDS CONFIRMATION**.

# 1. Audit Scope and Current Status

## 1.1 Implemented

- Spring Boot backend foundation.
- DAO-style package architecture: Controller -> Service/ServiceImpl -> DAO -> Database.
- MySQL 8 runtime configuration and Flyway schema migrations.
- Core and SRS-extension JPA entities, enums, and Spring Data DAO interfaces.
- Shared `ApiResponse`, `ErrorResponse`, exceptions, and `GlobalExceptionHandler` conventions.
- **UC-01 Login backend**, including username/email login, BCrypt comparison, account status/role checks, JWT generation, remember-me expiration, `/auth/login`, and `/auth/me`.
- UC-01 service and controller integration tests.
- Postman-facing UC-01 API documentation.

## 1.2 Foundation Only

The following are present as entities, DAOs, and in some cases early service methods/tests, but they are not complete use-case implementations:

- Courses, lessons/materials, groups/members.
- Assignment and final result foundations.
- Course enrollment, assignment submission, submission attachments.
- Peer review assignment and peer review.
- Result appeals are retained because they appear in the design, although UC-11/UC-12 are deferred.
- Existing non-auth service tests verify selected foundation rules; they do not prove the full related use cases are implemented.

## 1.3 Not Implemented Yet

The following should be classified as **NOT_IMPLEMENTED_YET**, not failed code:

- UC-02 through UC-10 and UC-14 complete controller/DTO/API/frontend flows.
- React login screen and role dashboards.
- Multi-role login selection.
- Persistent remember-me token storage.
- Full authorization rules for every future endpoint.
- Complete frontend-to-backend sequence traces for use cases other than UC-01.

## 1.4 Current Implemented Use Case

**UC-01 Login is the only implemented use case in the current scope.** Other domain code is foundation scaffolding for later phases.

# 2. Mapping Types Explained

1. **SRS/use case -> business rules and validation.** The report states what users may do, preconditions, success/alternate flows, and exact error messages. Services should enforce these rules.
2. **Class diagram -> classes/entities/database.** UML classes become Java classes/entities; attributes become fields/columns; associations become JPA relationships and foreign keys; inheritance becomes a JPA inheritance strategy.
3. **Sequence diagram -> method flow.** Each message should correspond to a call in the View, Controller, Service, DAO, or Database path.
4. **Architecture guideline -> ownership.** Controllers handle HTTP/DTO concerns, ServiceImpl owns business rules, DAOs query persistence, and entities map database state.
5. **Tests/Postman -> runtime verification.** Tests verify repeatable behavior automatically. Postman verifies the deployed HTTP contract manually. Code review alone verifies structure, not runtime behavior.

# 3. Overall Class Diagram to Code/Database Mapping

| Design element | Expected responsibility/meaning | Java implementation | Database implementation | DAO | Status | Evidence | Explanation for students |
|---|---|---|---|---|---|---|---|
| `User` | Account identity, credentials, role, status | `entity.User` | `app_users`: `id`, `username`, `email`, `password_hash`, `full_name`, `user_role`, `phone_number`, `status` | `UserDao` | MATCH | `entity/User.java`; V1 `CREATE TABLE app_users`; `UserDao.findByUsernameOrEmail` | The UML account class maps to one JPA entity and one account table. Password is intentionally mapped as a hash. |
| `UserRole` | Student/Lecturer/Administrator role | `enumeration.UserRole` | `app_users.user_role`; check values `STUDENT`, `LECTURER`, `ADMINISTRATOR` | Via `UserDao` | MATCH | `enumeration/UserRole.java`; V1 `chk_app_users_role` | Enum-as-string keeps Java and SQL role values readable. |
| `UserStatus` | Active/inactive/locked account state | `enumeration.UserStatus` | `app_users.status`; check values `ACTIVE`, `INACTIVE`, `LOCKED` | Via `UserDao` | MATCH | `enumeration/UserStatus.java`; V1 `chk_app_users_status` | UC-01 uses this state to block locked/inactive login. |
| `Course` | Course owned by lecturer, invitation/deadline settings | `entity.Course` | `courses`, including `lecturer_id`, `invitation_code`, `group_formation_deadline`, `course_status` | `CourseDao` | MATCH | `entity/Course.java`; V1 `courses`; `dao/CourseDao.java` | SRS-required invitation/deadline/status fields extend the simplified UML. |
| `StudentGroup` | Course group with capacity/status | `entity.StudentGroup` | `student_groups` with `course_id`, `max_members`, `group_status` | `StudentGroupDao` | MATCH | `entity/StudentGroup.java`; V1 `student_groups` | Group membership is separated into `GroupMember`. |
| `GroupMember` | Explicit membership replacing UML `List<User>` | `entity.GroupMember` | `group_members`, unique `(group_id,user_id)` | `GroupMemberDao` | INTENTIONAL_EXTENSION_FROM_SRS | `entity/GroupMember.java`; V1 `group_members`; approved Phase 2B decision 5 | Explicit join entity supports membership queries and `joined_at`. |
| `Lesson` | Course module/week | `entity.Lesson` | `lessons.course_id` | `LessonDao` | MATCH | `entity/Lesson.java`; V1 `lessons` | Direct StudentGroup-Lesson relation was intentionally not implemented; access is through Course. |
| `LessonMaterial` | Abstract material owned by lesson or assignment | Abstract `entity.LessonMaterial` | `lesson_materials` with discriminator and optional `lesson_id`/`assignment_id` | `LessonMaterialDao` | MATCH | `entity/LessonMaterial.java`; V1 `chk_lesson_materials_owner` | One shared table supports lesson materials and assignment guideline files. |
| `FileAttachment` | File material subtype | `entity.FileAttachment` | `lesson_materials` rows where `material_type='FILE'`; file columns | `LessonMaterialDao` | MATCH | `@DiscriminatorValue("FILE")`; V1 material type check | JPA `SINGLE_TABLE` inheritance avoids a separate table for each material subtype. |
| `LinkAttachment` | Link material subtype | `entity.LinkAttachment` | `lesson_materials` rows where `material_type='LINK'`; URL/label columns | `LessonMaterialDao` | MATCH | `@DiscriminatorValue("LINK")`; V1 material type check | Same inheritance strategy as file material. |
| `Assignment` | Assignment under lesson with submission/review deadlines | `entity.Assignment` | `assignments`, including `submission_deadline`, `review_deadline`, `lesson_id`, `showcase_mode` | `AssignmentDao` | MATCH | `entity/Assignment.java`; V1 `assignments` and `chk_assignments_dates` | UML `deadline` was intentionally clarified as `submissionDeadline`. |
| `AssignmentResult` | Lecturer's official result for assignment/group | `entity.AssignmentResult` | `assignment_results`; surrogate PK; unique `(assignment_id,group_id)`; publication/audit columns | `AssignmentResultDao` | INTENTIONAL_DIFFERENCE | `entity/AssignmentResult.java`; V1 `assignment_results`; approved decisions 10-12 | Surrogate ID and publication fields were approved to support UC-09/UC-10. This is not peer review data. |
| `ResultAppeal` | Appeal attached to final result | `entity.ResultAppeal` | `result_appeals`; unique `assignment_result_id`; resolution fields | `ResultAppealDao` | MATCH | `entity/ResultAppeal.java`; V1 `result_appeals` | Retained as foundation even though appeal controllers are deferred. |
| `CourseEnrollment` | Student-course membership independent of group | `entity.CourseEnrollment` | `course_enrollments`; unique `(course_id,student_id)` | `CourseEnrollmentDao` | INTENTIONAL_EXTENSION_FROM_SRS | `entity/CourseEnrollment.java`; V1 `course_enrollments`; UC-05 requirement | It is absent from simplified UML but necessary because a student joins a course before/independently of a group. |
| `AssignmentSubmission` | Group's assignment submission and submitter | `entity.AssignmentSubmission` | `assignment_submissions`; unique `(assignment_id,group_id)` | `AssignmentSubmissionDao` | INTENTIONAL_EXTENSION_FROM_SRS | `entity/AssignmentSubmission.java`; V1 table; UC-06 | Foundation exists; UC-06 API/service flow is NOT_IMPLEMENTED_YET. |
| `SubmissionAttachment` | Files/links submitted as evidence | `entity.SubmissionAttachment` | `submission_attachments`; type/payload checks | `SubmissionAttachmentDao` | INTENTIONAL_EXTENSION_FROM_SRS | `entity/SubmissionAttachment.java`; V1 table; approved decision 8 | Separate from teaching materials because submitted evidence has different ownership/lifecycle. |
| `PeerReviewAssignment` | Reviewer-group to target-group task | `entity.PeerReviewAssignment` | `peer_review_assignments`; assignment/reviewer/reviewee FKs; unique tuple; no-self check | `PeerReviewAssignmentDao` | INTENTIONAL_EXTENSION_FROM_SRS | `entity/PeerReviewAssignment.java`; V1 table; UC-14 | Required by UC-14 even though absent from simplified class diagram. Full UC-14 flow is NOT_IMPLEMENTED_YET. |
| `PeerReview` | Submitted score/comment for an assigned review | `entity.PeerReview` | `peer_reviews`; unique review assignment; submitter FK; score check | `PeerReviewDao` | INTENTIONAL_EXTENSION_FROM_SRS | `entity/PeerReview.java`; V1 table; UC-07 | Stores peer evidence separately from official `AssignmentResult`. Full UC-07 flow is NOT_IMPLEMENTED_YET. |

# 4. Relationship and Constraint Mapping

| Design meaning | Code/entity evidence | Database evidence | Status | Risk/notes |
|---|---|---|---|---|
| Lecturer owns/manages many courses | `Course.lecturer` is `@ManyToOne User` | `courses.lecturer_id -> app_users.id`, `RESTRICT` | MATCH | DB does not enforce that referenced user has `LECTURER` role; current `CourseServiceImpl.createCourse` checks it. Full ownership API is NOT_IMPLEMENTED_YET. |
| Course has many groups | `StudentGroup.course` | `student_groups.course_id -> courses.course_id`; unique course/group name | MATCH | Unidirectional mapping is sufficient; `Course` does not need an in-memory collection. |
| Course has many lessons | `Lesson.course` | `lessons.course_id -> courses.course_id` | MATCH | Direct group-to-lesson mapping was intentionally rejected. |
| Lesson has many materials | `LessonMaterial.lesson`; DAO `findByLessonId` | `lesson_materials.lesson_id -> lessons.lesson_id` | MATCH | DB owner check requires exactly one of lesson/assignment. |
| LessonMaterial inheritance | `@Inheritance(SINGLE_TABLE)`, discriminator values `FILE`/`LINK` | One `lesson_materials` table with discriminator and subtype columns | MATCH | Subtype-specific non-null combinations are only partly constrained; file/link field completeness is mainly future service validation. |
| Assignment belongs to lesson/course context | `Assignment.lesson`; `Lesson.course` | `assignments.lesson_id -> lessons.lesson_id` | MATCH | Course is reached transitively through lesson, matching approved course-centric model. |
| AssignmentResult links assignment and group | Two mandatory `@ManyToOne` fields | FKs plus unique `(assignment_id,group_id)` | MATCH | DB does not prove group belongs to assignment's course; future grading service must validate course consistency. |
| ResultAppeal links assignment result | `ResultAppeal.assignmentResult` `@OneToOne` | Unique FK `assignment_result_id` | MATCH | Appeal UCs are deferred; foundation service code exists but should not be presented as complete UC-11/UC-12. |
| Student joins many courses | `CourseEnrollment.course/student` | Unique `(course_id,student_id)` and two FKs | MATCH | A user role of STUDENT is enforced by future service, not FK. |
| Student belongs to at most one group per course | `GroupServiceImpl.joinGroup` calls `GroupMemberDao.existsByCourseIdAndUserId` | Only unique `(group_id,user_id)` exists | PARTIAL | Service enforces the rule in normal flow, but DB does not prevent concurrent/direct inserts into two groups in one course. Consider DB-level enforcement or transactional locking later. |
| PeerReviewAssignment links assignment/reviewer/target | `assignment`, `reviewerGroup`, `revieweeGroup` | Three FKs; unique pair tuple; check reviewer != reviewee | MATCH | DB does not enforce both groups belong to assignment's course; UC-14 service must enforce it. |
| PeerReview links review assignment/reviewer | `peerReviewAssignment` one-to-one; `submittedBy` user; reviewer group reachable through assignment | Unique `peer_review_assignment_id`; submitter FK | MATCH | Future UC-07 service must verify submitter belongs to reviewer group and deadline is open. |

# 5. Database Migration Audit

## 5.1 Migration Table

| Migration | Purpose | Evidence | Status |
|---|---|---|---|
| `V1__init_schema.sql` | MySQL 8 foundation schema | 14 `CREATE TABLE` statements, InnoDB, utf8mb4, PK/FK/check/unique constraints | MATCH |
| `V2__seed_demo_users.sql` | Demo UC-01 accounts | Inserts admin, lecturer, student into `app_users` using BCrypt strings | MATCH |

## 5.2 Important Tables Created

`app_users`, `courses`, `course_enrollments`, `student_groups`, `group_members`, `lessons`, `assignments`, `lesson_materials`, `assignment_submissions`, `submission_attachments`, `peer_review_assignments`, `peer_reviews`, `assignment_results`, and `result_appeals`.

## 5.3 Syntax and Runtime Evidence

- V1 uses MySQL-oriented `BIGINT AUTO_INCREMENT`, `DATETIME(6)`, `ENGINE=InnoDB`, `utf8mb4`, and explicit `RESTRICT` foreign keys.
- Test configuration uses H2 in MySQL compatibility mode, not production configuration.
- Fresh `mvnw clean test` logs show Flyway validated and applied V1 and V2 and reported schema version 2.
- This proves migration compatibility with H2 MySQL mode. **Real MySQL migration execution is NOT_VERIFIED_YET in this audit** because Docker Desktop was unavailable.

## 5.4 Demo Data Status

| Account | Role value | Hash status | Verification |
|---|---|---|---|
| `admin01` | `ADMINISTRATOR` | BCrypt `$2a$10$...` | Integration test logs in and calls `/auth/me` |
| `lecturer01` | `LECTURER` | BCrypt `$2a$10$...` | Integration test logs in by email |
| `student01` | `STUDENT` | BCrypt `$2a$10$...` | Integration test logs in by username |

No plain-text password is stored in V2. Raw demo passwords appear only in test/API documentation for local demonstration.

## 5.5 `flyway_schema_history`

- Flyway creates and maintains `flyway_schema_history` automatically; it is not declared manually in V1.
- Fresh test logs show successful application of versions 1 and 2 and subsequent startup at current version 2.
- Actual rows in a real MySQL `flyway_schema_history` table are **NEEDS CONFIRMATION** because the MySQL container was unavailable.

## 5.6 Naming Difference

The sequence diagram says `SELECT * FROM users`, while implementation maps `User` to `app_users`. This is an **INTENTIONAL_TABLE_NAMING_DIFFERENCE**, documented in mapping/decision plans. DAO/JPA code correctly targets `app_users`; no raw `users` query is used.

## 5.7 Database Risks

- Docker publishes `3307:3306`, but `application.yml` defaults to `DB_PORT:3306`. Local Docker requires `DB_PORT=3307`, or the Compose/default config must be aligned. Current environment value is **NEEDS CONFIRMATION**.
- Production `app.jwt.secret` has an unsafe development default. A strong `JWT_SECRET` environment value is required outside local development.
- V2 inserts fixed demo accounts in every environment where migrations run. Confirm whether production deployment should include demo accounts.

# 6. Architecture / 3-Tier Layer Audit

| Layer | Expected responsibility | Current packages/classes | Evidence | Status | Notes |
|---|---|---|---|---|---|
| Presentation/API | HTTP endpoints, request/response DTOs, no persistence logic | `controller.HealthController`, `controller.auth.AuthController`, auth DTO records | `AuthController.login/me` delegate to `AuthService` | MATCH | React is NOT_IMPLEMENTED_YET. Health returns a Map rather than `ApiResponse`, an intentional legacy/simple endpoint difference. |
| Business logic | Validation, orchestration, permission/status rules | `service.AuthService`, `service.impl.AuthServiceImpl`; other foundation services | Login blank/credential/password/status/role checks are in `AuthServiceImpl.login` | MATCH | Non-auth service code is foundation, not full UCs. |
| Data access | Spring Data queries only | `dao.*Dao` | All DAOs extend `JpaRepository`; derived query/one JPQL membership query | MATCH | No controller injects a DAO. |
| Persistence | Entity-table mapping and database constraints | `entity`, `enumeration`, Flyway V1/V2 | JPA annotations correspond to schema tables/FKs | MATCH | H2 validates mappings in tests; real MySQL still needs runtime verification. |
| Mapping | Convert entities/security principal to response DTOs | `mapper.AuthMapper` | `toLoginResponse`, `toCurrentUserResponse` | MATCH | Other use-case mappers are NOT_IMPLEMENTED_YET. |
| Error handling | Consistent exception-to-HTTP response | `exception.*`, `GlobalExceptionHandler`, `ErrorResponse` | Auth service throws typed API exceptions | MATCH | Spring Security filter-chain 401/403 responses are not proven to use `ErrorResponse`; unauthorized `/auth/me` test is missing. |
| Security | BCrypt, JWT, principal/filter, endpoint rules | `SecurityConfig`, `JwtTokenProvider`, `JwtAuthenticationFilter`, `CustomUserDetailsService`, `CustomUserPrincipal` | Public `/health` and `/auth/login`; other paths authenticated | PARTIAL | Valid-token flow is tested. Expired/tampered token and post-login account status changes are not tested. |

## 6.1 Explicit Rule Checks

| Rule | Finding | Status |
|---|---|---|
| Controllers do not access DAO/database | `AuthController` depends only on `AuthService`; `HealthController` has no persistence dependency | MATCH |
| Controllers do not contain business rules | Auth controller only checks presence/type of authenticated principal for `/me`; credential rules are in service | MATCH |
| Services handle business validation | `AuthServiceImpl.login`, group/assignment/result foundation services contain checks | MATCH |
| DAOs only handle queries | Spring Data interfaces and one JPQL existence query | MATCH |
| DTOs used for API input/output | Login and current-user endpoints use `LoginRequest`, `LoginResponse`, `CurrentUserResponse` | MATCH |
| Entities not exposed by implemented APIs | UC-01 returns DTOs, not `User` | MATCH |
| Mappers used/prepared | `AuthMapper` is actively used; package exists for future UCs | MATCH |
| Global exception handling | `ApiException`, validation, illegal argument, generic exception handlers exist | MATCH |
| ApiResponse/ErrorResponse convention | UC-01 success uses `ApiResponse`; service errors become `ErrorResponse` | MATCH |

# 7. UC-01 Login Design-to-Code Mapping

| Use case/sequence step | Expected design object | Implemented file/class | Implemented method | Evidence | Status | Notes for defense |
|---|---|---|---|---|---|---|
| Login form/view | `LoginBoundaryView` | No React component | N/A | Frontend explicitly deferred | MISSING | This is expected in current phase; backend can be demonstrated with Postman. |
| Submit login request | `AuthController` | `controller/auth/AuthController.java` | `login(LoginRequest)` | `@PostMapping("/login")` | MATCH | Context path `/api` makes external URL `/api/auth/login`. |
| Validate credentials | `AuthService` | `AuthService`, `AuthServiceImpl` | `login(LoginRequest)` | Controller delegates to interface; implementation owns flow | MATCH | Demonstrates Controller -> ServiceImpl separation. |
| Find account | `UserDAO` | `dao/UserDao.java` | `findByUsernameOrEmail` | Spring Data derived query | MATCH | Supports both report form modes without raw SQL. |
| Query database | Database | `User`/`app_users` | JPA-generated SQL | `@Table(name="app_users")`; V1 | INTENTIONAL_DIFFERENCE | Diagram's `users` name is outdated/simplified. |
| Missing credentials | Controller/service error | `AuthServiceImpl` | initial blank check | Exact constant and `BadRequestException` | MATCH | Integration test expects exact SRS message and HTTP 400. |
| Invalid credentials | Service error | `AuthServiceImpl` | missing user or `PasswordEncoder.matches=false` | Exact `UnauthorizedException` message | MATCH | Same message avoids revealing whether username exists. |
| Locked/inactive | Service status check | `AuthServiceImpl` | `user.status != ACTIVE` | Exact `ForbiddenException` message | MATCH | Unit tests cover both INACTIVE and LOCKED. |
| No assigned role | Service role check | `AuthServiceImpl` | `user.getUserRole()==null` | Exact `ForbiddenException` message | PARTIAL | Code/unit test exist, but DB column is `NOT NULL`, so real persisted no-role state cannot normally occur. |
| BCrypt password check | Authentication service | `SecurityConfig`, `AuthServiceImpl` | `BCryptPasswordEncoder`; `matches` | Hash-only V2 and successful integration logins | MATCH | Raw password is compared to hash; it is never queried as plaintext. |
| Remember Me | Persistent token in report/sequence | `LoginRequest`, `JwtTokenProvider` | `rememberMeOrDefault`, `getExpirationMs` | Normal vs remember expiration config | INTENTIONAL_IMPLEMENTATION_ADAPTATION | Approved stateless adaptation; no token table. Unit test verifies selected expiration path. |
| Multiple roles | Role-selection branch | Single `UserRole`; no selection endpoint | N/A | Approved Phase 2B/4B scope | INTENTIONAL_DIFFERENCE | **DEFERRED_BY_APPROVED_SCOPE**. Do not claim this branch is implemented. |
| Secure session | Report says secure session | `JwtTokenProvider`, `JwtAuthenticationFilter` | `generateToken`, `validateToken` | Stateless HS256 JWT and Spring Security context | INTENTIONAL_IMPLEMENTATION_ADAPTATION | Suitable for React/Spring API; sequence/report should name JWT instead of server session. |
| Login by username/email | Report says Username/Email | `UserDao`, `AuthServiceImpl` | `findByUsernameOrEmail` | Username and email integration tests | MATCH | Better match than the sequence's username-only query. |
| Return user/token | Controller response | `AuthMapper`, `LoginResponse` | `toLoginResponse` | Token, expiration, DTO user, dashboard path | MATCH | Entity is not exposed. Dashboard path is a hint; dashboard UI is not implemented. |
| `/api/auth/login` public | Security/API | `SecurityConfig`, `AuthController` | matcher `/auth/login`; POST mapping | Integration test without authentication passes | MATCH | External path includes `/api` context. |
| `/api/auth/me` | Current-user support | `AuthController`, JWT filter/principal | `me`, `getCurrentUser` | Login-token-to-me integration test | MATCH | Valid-token path verified. Missing/invalid token response shape is not tested. |
| Role redirect/display dashboard | View responsibility | No frontend/dashboard | N/A | Explicitly deferred | MISSING | Backend returns `dashboardPath`; actual redirect is NOT_IMPLEMENTED_YET. |

## 7.1 Sequence Trace Summary

Implemented backend trace:

```text
POST /api/auth/login
  -> AuthController.login(LoginRequest)
  -> AuthService.login(LoginRequest)
  -> AuthServiceImpl.login(LoginRequest)
  -> UserDao.findByUsernameOrEmail(...)
  -> JPA -> app_users
  -> BCrypt check + status/role validation
  -> JwtTokenProvider.generateToken(...)
  -> AuthMapper.toLoginResponse(...)
  -> ApiResponse<LoginResponse>
```

Authenticated current-user trace:

```text
Bearer JWT
  -> JwtAuthenticationFilter
  -> JwtTokenProvider.validateToken/getUsername
  -> CustomUserDetailsService
  -> UserDao.findByUsername
  -> SecurityContext
  -> AuthController.me
  -> AuthService.getCurrentUser
  -> AuthMapper
  -> ApiResponse<CurrentUserResponse>
```

# 8. Test and Runtime Evidence

Fresh command run during this audit:

```text
.\mvnw.cmd clean test
```

Result:

```text
Tests run: 30, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

| Evidence | Coverage | Classification | Notes |
|---|---|---|---|
| `AuthServiceTest` (8 tests) | Username/email success, JWT response, remember expiration path, missing, invalid, inactive, locked, no role, not found | VERIFIED_BY_TEST | Password matching uses real BCrypt encoder; token provider is mocked in service unit tests. |
| `AuthControllerIntegrationTest` (5 tests) | Public login, username/email, exact missing/invalid messages, generated JWT, `/auth/me` | VERIFIED_BY_TEST | Uses Spring context, H2 MySQL mode, Flyway V1/V2, seeded hashes. |
| `AssignmentServiceTest` (2) | Deadline rule | VERIFIED_BY_TEST | Foundation rule only; UC-04 is NOT_IMPLEMENTED_YET. |
| `GroupServiceTest` (4) | Role, one-group service check, capacity | VERIFIED_BY_TEST | Foundation rule only; UC-03/05 not complete. |
| `AssignmentResultServiceTest` (4) | Create/update and score range | VERIFIED_BY_TEST | Foundation rule only; UC-09 not complete. |
| `ResultAppealServiceTest` (6) | Appeal foundation rules | VERIFIED_BY_TEST | Appeal use cases remain deferred. |
| `PeergradehubApplicationTests` (1) | Spring context, Flyway/JPA wiring | VERIFIED_BY_TEST | Uses H2 profile, not real MySQL. |
| `docs/api/auth-login.md` | Postman request/response/demo account instructions | VERIFIED_BY_CODE_REVIEW | Documentation is consistent with controller DTOs. |
| User statement that Postman login succeeds | Manual login behavior | VERIFIED_BY_POSTMAN | User-reported; raw Postman collection/output was not present, so exact run evidence is NEEDS CONFIRMATION. |
| `GET /api/health` | Public health mapping/security | VERIFIED_BY_CODE_REVIEW | Existing health endpoint was not directly asserted in current tests. |
| Real MySQL startup/migrations/data | Production DB behavior | NOT_VERIFIED_YET | Docker Desktop unavailable during audit. |

# 9. Deviations From Design

| Design/report expectation | Current implementation | Type | Reason | Recommended action |
|---|---|---|---|---|
| Table/query named `users` | JPA table `app_users` | ACCEPTABLE_ADAPTATION; NEEDS_SEQUENCE_UPDATE | Avoids reserved/generic naming risk and is an approved decision | Update sequence database message to `app_users` or use conceptual `User` lookup without raw SQL text. |
| `User.authenticate()` operation | `AuthServiceImpl.login()` | ACCEPTABLE_ADAPTATION; NEEDS_REPORT_UPDATE | Authentication coordinates DAO, BCrypt, status, JWT, errors; service is the correct architectural owner | Explain in report that UML operation is realized by auth service orchestration, not entity persistence logic. |
| Secure server session | Stateless JWT | ACCEPTABLE_ADAPTATION; NEEDS_SEQUENCE_UPDATE | React/Spring REST architecture benefits from Bearer tokens and stateless security | Rename sequence messages to `generateJwt`/`returnToken`; document security context reconstruction. |
| Multiple-role role selection | One `UserRole` enum | SCOPE_DECISION | Explicit MVP decision | Mark alternate flow deferred in report/sequence or revise UC-01 MVP specification. |
| Persistent remember-me token/table | Longer-lived JWT only | SCOPE_DECISION; NEEDS_SEQUENCE_UPDATE | Explicitly approved; avoids token persistence table | Replace `storePersistentToken` sequence with `generateJwt(rememberMeExpiration)`. |
| Simplified class diagram lacks enrollment/submission/review-assignment classes | Added explicit entities/tables/DAOs | ACCEPTABLE_ADAPTATION; NEEDS_REPORT_UPDATE | Required by selected SRS use cases and audit fields | Extend design class diagram or add a technical/persistence class diagram. |
| No-role exception | Service guard exists; DB role is `NOT NULL` | ACCEPTABLE_ADAPTATION | Defensive check preserves SRS message, but persisted invalid state is prevented | Clarify that DB integrity normally prevents this branch; retain unit test. |
| One group per course | Service query check, no direct DB uniqueness across course/user | NEEDS_CODE_REFACTOR (later) | Normal flow is covered, but concurrency/direct writes could bypass it | Before UC-05, add robust transactional/DB enforcement strategy. |
| Global error envelope | MVC exceptions use `ErrorResponse`; security entry-point responses unverified | NEEDS_MINOR_REFACTOR | Filter-chain failures bypass controller advice by default | Add/test JSON `AuthenticationEntryPoint` and `AccessDeniedHandler` before broader protected APIs. |
| Account disabled after JWT issuance | Filter loads principal but sets authentication without checking `isEnabled/isAccountNonLocked` | NEEDS_MINOR_REFACTOR | Login blocks bad status, but an existing token may remain usable after account status changes | Reject disabled/locked principals in JWT filter or central authentication provider. |
| Docker host port | Compose `3307`, app default `3306` | NEEDS_REPORT_UPDATE / config confirmation | Environment override may be intended | Document/set `DB_PORT=3307` for Compose or align defaults. |

# 10. Viva / Defense Questions and Suggested Answers

## How did you map the class diagram to code?

Each UML class became a Java entity or enum. Attributes became fields/columns, associations became `@ManyToOne`/`@OneToOne` plus foreign keys, multiplicities became unique constraints, and material inheritance became JPA `SINGLE_TABLE` inheritance.

## Why does the database have more tables than the class diagram?

The class diagram is a simplified domain view. The SRS requires technical/domain-support concepts such as course enrollment, group membership, assignment submissions, and peer-review assignments. These were approved extensions, not random tables.

## Why is User stored in `app_users` instead of `users`?

`app_users` is an explicit, approved table name that avoids generic/reserved-name risk. The `User` entity maps to it with `@Table(name="app_users")`. The sequence diagram's `users` text should be updated.

## Why is password stored as `password_hash`?

Passwords must not be recoverable from the database. The application stores BCrypt hashes and calls `PasswordEncoder.matches(raw, hash)` during login. V2 contains only hashes.

## How did you map the Login sequence diagram to code?

`LoginBoundaryView` is represented by Postman for now; `AuthController.login` receives the DTO; `AuthServiceImpl.login` validates; `UserDao.findByUsernameOrEmail` queries `app_users`; BCrypt verifies the password; JWT is generated; `AuthMapper` builds the response DTO.

## Why use AuthServiceImpl instead of putting authenticate logic inside User?

Login is orchestration involving persistence, password encoding, account policy, token generation, exceptions, and response mapping. Putting this in the entity would couple domain state to infrastructure. The service layer matches the required architecture.

## How do you ensure Controller does not contain business logic?

The controller only maps HTTP requests/responses and delegates to `AuthService`. Credential, status, role, and remember-me rules are in `AuthServiceImpl` and covered by service tests.

## How do you know the app uses MySQL and not H2 when running?

The main `application.yml` uses a `jdbc:mysql://...` URL and MySQL Connector/Flyway support. H2 appears only in `application-test.yml` under the test profile. Real MySQL runtime still needs environment/container verification.

## What is Flyway and why is `flyway_schema_history` present?

Flyway applies versioned SQL migrations in order and records checksums/status in `flyway_schema_history`. That lets the team know whether V1 and V2 were already applied and prevents silent schema drift.

## Can a student join courses from multiple lecturers?

Yes. `course_enrollments` is unique only on `(course_id, student_id)`, so the same student can enroll in many different courses. Each course independently references its lecturer.

## Which parts are implemented and which are only foundation?

UC-01 backend is implemented and tested. The database/entities/DAOs for courses, groups, assignments, submissions, reviews, results, and appeals are foundation. Their complete controllers, DTOs, sequence-aligned services, and frontend screens are not implemented yet.

## Why is Remember Me not stored in a token table?

The approved MVP uses stateless JWT. Remember Me selects a longer expiration value, avoiding a persistent token table. The sequence diagram should be updated to show this adaptation.

## Why is `AssignmentResult` separate from `PeerReview`?

The SRS says peer-review scores are evidence only; the lecturer decides the official result. Therefore `PeerReview` stores peer evidence and `AssignmentResult` stores the official grade/publication state.

# 11. Final Verdict

## Overall Mapping Status

**PASS_WITH_NOTES**

The current implementation has a coherent trace from report/class decisions to JPA/Flyway and from the UC-01 sequence to Controller -> Service/ServiceImpl -> DAO -> Database. Approved SRS extensions are identifiable and documented rather than hidden.

## Is the Current Foundation Acceptable?

**Yes.** The entities, DAOs, constraints, MySQL configuration, migrations, response conventions, and tests form an acceptable OOSE foundation. Unimplemented use cases are correctly treated as future work.

## Is UC-01 Login Acceptable for Defense?

**Yes, with notes.** The backend flow, exact error messages, username/email lookup, BCrypt hashes, JWT, remember-me expiration, public login, protected `/auth/me`, DTO mapping, and tests are defensible. The team should explicitly explain the approved JWT, single-role, and `app_users` adaptations.

## Required Fixes Before Frontend / Broader Protected APIs

1. Update the UC-01 sequence/report wording for JWT, `app_users`, single role, and stateless Remember Me.
2. Align or document Docker host port `3307` versus application default `3306`.
3. Add/test JSON security responses for missing/invalid JWT and forbidden access.
4. Re-check account `ACTIVE`/`LOCKED` status when authenticating an existing JWT.
5. Set a strong external `JWT_SECRET` outside local development.

## Optional Improvements

- Add focused tests for expired/tampered JWT and remember-me expiration claims.
- Add an automated test for public `/health` and unauthenticated `/auth/me`.
- Decide whether demo seed users should be excluded from production environments.
- Add DB/concurrency-safe enforcement for one group per student per course before UC-05.
- Extend the class diagram with SRS-driven technical entities.

## Recommended Next Phase

Perform a small UC-01 hardening/document-sync phase, then implement the React Login view against the documented API. After that, proceed use case by use case with a sequence-to-code trace before implementation.
