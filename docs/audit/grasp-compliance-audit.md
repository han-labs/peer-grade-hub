# PeerGrade Hub GRASP Compliance Audit

Audit date: 2026-06-19  
Audit type: Static, evidence-based responsibility assignment audit  
Course reference: `OOAD_with_UML.pdf`, Responsibility Assignment Patterns / GRASP, pp. 78-87

# 1. Audit Scope

This audit evaluates the current backend against the five GRASP patterns required by the course: Expert, Creator, High Cohesion, Low Coupling, and Controller. It checks responsibility placement in the code that exists now. It does not grade planned code as though it were implemented.

The current implementation includes:

- Spring Boot packages for controllers, services and service implementations, DAOs, entities, DTOs, mappers, exceptions, configuration, and security.
- MySQL persistence and Flyway foundation migrations.
- Shared `ApiResponse`, `ErrorResponse`, and global exception handling.
- A complete backend implementation of UC-01 Login, including BCrypt verification, JWT creation, current-user lookup, and security error responses.
- Foundation entities, DAOs, and some services for courses, groups, lessons, assignments, results, and appeals.

The React frontend and most business use cases are not implemented. Submission, peer-review, monitoring, publishing, and several course/group flows currently have persistence foundations rather than complete Controller -> Service -> DAO execution paths. These are marked `NOT_IMPLEMENTED_YET`, not treated as GRASP failures.

Evidence was taken from the current backend source and tests, the project mapping audits and plans, the current README, and the course GRASP material. `docs/audit/design-to-code-defense-guide.md` was not present and therefore is `NEEDS_CONFIRMATION` as a reference.

# 2. GRASP Summary for This Project

| Pattern | Meaning | Spring Boot interpretation | Violation in this project | Acceptable adaptation |
|---|---|---|---|---|
| Expert | Assign behavior to the object with the information needed to perform it. | Domain-local rules belong near the entity that owns the state; a service coordinates DAOs, multiple entities, transactions, mappers, and security utilities. | Treating every `ServiceImpl` as the Expert even when it borrows entity state to perform a simple local rule. | A service remains the use-case orchestrator when the decision requires database queries, multiple aggregates, password verification, or token generation. |
| Creator | Let A create B when A contains B, closely uses B, records B, or has B's initialization data. | Mappers create DTOs, security utilities create tokens, and services may create entities from request/use-case data. | Controllers constructing domain graphs, entities creating infrastructure objects, or unrelated utilities creating business objects. | A service may build and save an entity when it owns the use-case input and persistence coordination. A parent factory is optional unless it protects an important invariant. |
| High Cohesion | Keep each class focused on one related purpose. | Controllers adapt HTTP, services orchestrate a use case, DAOs query data, mappers translate representations, and security classes handle security concerns. | A god service/controller, business rules in configuration, or a mapper that performs authorization and persistence. | Several methods are acceptable when they all serve one abstraction, such as global HTTP exception translation. |
| Low Coupling | Minimize unnecessary dependencies and avoid navigating through strangers. | Dependencies should point inward by layer: controller -> service; service -> DAO/domain/mapper; DAO -> entity/database. | Controller -> DAO, entity -> HTTP/JWT/Spring Security, DAO -> service, returning entities from APIs, or long nested getter chains. | Framework coupling inside adapters such as Spring Security filters and JPA DAOs is expected. |
| Controller | Put an object between actor/UI and the business objects. | A Spring MVC controller receives HTTP input, delegates the use case, and returns DTO/API responses. | A controller performs database queries, password checks, authorization rules, or domain decisions. | API-format validation and obtaining the authenticated principal are presentation/security adapter responsibilities. |

The course warning is important here: layering alone does not prove Expert or Creator. Package direction can be correct while a domain-local responsibility is still placed too high in a service.

# 3. Expert Audit

| Behavior / responsibility | Current owner class/method | GRASP Expert candidate | Enough information? | Status | Evidence | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| Check active/locked/inactive during login | `AuthServiceImpl.login` directly examines status; `CustomUserPrincipal` interprets status for Spring Security | `User` for the simple account-state fact; service/security adapter for authentication outcome | Yes, but the service reads raw state instead of using the existing domain fact | PARTIAL | `entity/User.java::isActive`; `service/impl/AuthServiceImpl.java::login`; `security/CustomUserPrincipal.java` | The same status rule can drift between login and JWT authentication | Use a clearly named `User.isActiveAccount()` or the existing `isActive()` consistently; keep HTTP exception selection in the service/security layer. |
| Check assigned role | `AuthServiceImpl.login` checks `user.getUserRole() == null` | `User.hasAssignedRole()` for the local fact | Yes, through a getter | PARTIAL | `service/impl/AuthServiceImpl.java::login`; `entity/User.java::userRole` | Repeated null checks may diverge in future authorization flows | Add a small domain query when another use case needs the same rule. Do not move authorization infrastructure into `User`. |
| Decide whether account is usable for authentication | `AuthServiceImpl`, `CustomUserDetailsService`, `CustomUserPrincipal`, and `JwtAuthenticationFilter` cooperate | `User` supplies state facts; `AuthServiceImpl` and security adapters combine credentials, state, and runtime context | No single class should own all required information | SATISFIED | `AuthServiceImpl.login`; `CustomUserPrincipal.isEnabled/isAccountNonLocked`; `JwtAuthenticationFilter.doFilterInternal` | Behavior can become inconsistent if state facts are duplicated | Preserve orchestration, while centralizing only reusable state predicates on `User`. |
| Verify password | `AuthServiceImpl.login` using `PasswordEncoder.matches` | `PasswordEncoder` for BCrypt; `AuthServiceImpl` for login coordination | Yes | SATISFIED | `service/impl/AuthServiceImpl.java`; `config/SecurityConfig.java::passwordEncoder` | None material | Keep password algorithm concerns outside the entity. |
| Check group capacity | `GroupServiceImpl` compares member count with `StudentGroup.maxMembers` | `StudentGroup.hasCapacity(int currentMemberCount)` | The service has count from DAO and borrows the group's limit | PARTIAL | `service/impl/GroupServiceImpl.java`; `entity/StudentGroup.java::maxMembers` | Capacity rules may be duplicated or bypassed | Let the service obtain the count, then ask `StudentGroup` to evaluate capacity. |
| Enforce one group per course | `GroupServiceImpl` queries `GroupMemberDao` | `GroupServiceImpl` plus `GroupMemberDao` | Yes; this is a cross-record persistence rule | SATISFIED | `GroupServiceImpl`; `dao/GroupMemberDao.java` | Depends on database constraint/query correctness | Keep orchestration in service and retain/verify the database uniqueness constraint. |
| Course ownership/status rules | Basic creation validation in `CourseServiceImpl`; broader use cases absent | `Course` for local lifecycle facts; service for lecturer/DAO checks | Enough for current foundation only | NOT_IMPLEMENTED_YET | `entity/Course.java`; `service/impl/CourseServiceImpl.java` | Future rules could accumulate in the service | Identify local course invariants before Manage Course is implemented. |
| Check assignment deadline ordering | `AssignmentServiceImpl` compares deadlines; `Assignment` already has `hasValidReviewDeadline()` | `Assignment` | Yes, and the entity already exposes the rule | PARTIAL | `entity/Assignment.java::hasValidReviewDeadline`; `service/impl/AssignmentServiceImpl.java` | Duplicate implementations can disagree | Make the service call the domain method or one shared domain validator. |
| Decide whether submission is open | Not implemented | `Assignment.isSubmissionOpen(LocalDateTime now)` | N/A | NOT_IMPLEMENTED_YET | `entity/Assignment.java::submissionDeadline`; no submission controller/service flow | Deadline boundary and status behavior remain undefined | Define from the SRS before Submit Assignment implementation. |
| Check assignment-result score range | `AssignmentResultServiceImpl` checks the numeric range; entity has `hasValidScore()` | `AssignmentResult` | Yes, and the rule is already present in the entity | PARTIAL | `entity/AssignmentResult.java::hasValidScore`; `service/impl/AssignmentResultServiceImpl.java` | Duplicate validation can drift | Reuse the entity predicate from the service. |
| Decide whether a result can be published | No publishing flow exists | `AssignmentResult.isPublishable()` for local state; service for authorization and dependent-record checks | N/A | NOT_IMPLEMENTED_YET | Publish/audit fields in `entity/AssignmentResult.java`; no publish service/controller | Publishing may occur without a defined invariant | Specify required score/audit state before Manage Final Grade implementation. |
| Create login response data | `AuthMapper.toLoginResponse` and `toCurrentUserResponse` | `AuthMapper` | Yes | SATISFIED | `mapper/AuthMapper.java` | `dashboardPath` embeds a small UI navigation policy in backend mapping | Keep current behavior; consider a resolver or frontend ownership only if role/navigation rules grow. |
| Create and validate JWT | `JwtTokenProvider` | `JwtTokenProvider` | Yes; it owns key, claims, expiration, and JWT library use | SATISFIED | `security/JwtTokenProvider.java` | Security-sensitive code requires focused tests | Keep JWT concerns isolated and tested. |
| Create/resolve an appeal and verify ownership | `ResultAppealServiceImpl` coordinates DAOs and traverses result relationships | Service for cross-record workflow; entities for local facts | It has the required objects, but reaches through several strangers | PARTIAL | `service/impl/ResultAppealServiceImpl.java`, including `appeal.getAssignmentResult().getAssignment().getLesson().getCourse().getLecturer()` | Fragile coupling and lazy-loading risk | Before implementing the appeal controller, replace deep navigation with a focused DAO query or an aggregate/domain query method. |
| Determine enrollment facts | No complete enrollment service flow | `CourseEnrollment` for local status; service/DAO for uniqueness and invitation lookup | N/A | NOT_IMPLEMENTED_YET | `entity/CourseEnrollment.java`; `dao/CourseEnrollmentDao.java` | Future invitation and duplicate-enrollment logic has no assigned Expert yet | Assign responsibilities during sequence-to-code planning. |
| Determine submission status/ownership | No complete submission flow | `AssignmentSubmission` for local submission facts; service for deadline and persistence checks | N/A | NOT_IMPLEMENTED_YET | `entity/AssignmentSubmission.java`; `dao/AssignmentSubmissionDao.java` | Rules could be centralized in a large service | Add only domain predicates justified by the SRS. |
| Detect peer self-review | No peer-review assignment flow | `PeerReviewAssignment.isSelfReview()` | N/A | NOT_IMPLEMENTED_YET | `entity/PeerReviewAssignment.java`; no service/controller | Self-review could be assigned accidentally | Compare reviewer and target group identities in a domain predicate, then enforce it in the service. |
| Verify reviewer and target groups belong to the same assignment/course | No peer-review assignment flow | Service as cross-aggregate Expert, supported by focused DAO methods; entity may expose local identity checks | N/A | NOT_IMPLEMENTED_YET | `PeerReviewAssignment`, `Assignment`, and group foundations only | Deep traversal could repeat the appeal-service problem | Query explicit IDs/ownership in DAO and avoid long getter chains. |
| Record a submitted peer review | No complete review flow | `PeerReview` for local review state; service for assignment authorization and persistence | N/A | NOT_IMPLEMENTED_YET | `entity/PeerReview.java`; `dao/PeerReviewDao.java` | Validation ownership is not yet defined | Decide responsibilities from the peer-review sequence diagram before coding. |

**Expert conclusion:** The architecture correctly uses services as coordinators, but Expert is the weakest of the five patterns. The most visible issue is not a large violation; it is duplicated domain-local validation in services even where entity predicates already exist. Cross-record, security, DAO, and JWT work correctly remains outside entities.

# 4. Creator Audit

| Created object | Current creator | GRASP Creator candidate | Has/uses initialization data? | Status | Evidence | Recommendation |
|---|---|---|---|---|---|---|
| `Course` | `CourseServiceImpl` | Service or a future course factory | Yes; service has use-case data and lecturer context | SATISFIED | `service/impl/CourseServiceImpl.java` | A factory is unnecessary until construction invariants grow. |
| `Lesson` | `LessonServiceImpl` | Service or `Course` helper | Yes | SATISFIED | `service/impl/LessonServiceImpl.java` | Consider `Course.addLesson(...)` only if aggregate invariants require it. |
| `StudentGroup` | `GroupServiceImpl` | Service; optionally `Course.createGroup(...)` | Yes; service has course and request data | SATISFIED | `service/impl/GroupServiceImpl.java` | Keep service creation unless a course-owned invariant emerges. |
| `GroupMember` | `GroupServiceImpl` | `StudentGroup.addMember(...)` or service | Yes; service has group, student, and DAO-derived membership facts | PARTIAL | `GroupServiceImpl`; `entity/GroupMember.java` | A group helper would improve Creator and protect capacity/member construction, but is not required for current behavior. |
| `Assignment` | `AssignmentServiceImpl` | Service or `Lesson.createAssignment(...)` | Yes | SATISFIED | `service/impl/AssignmentServiceImpl.java` | Reuse entity validation during creation. |
| `AssignmentResult` | `AssignmentResultServiceImpl` | Service or assignment/group aggregate helper | Yes; service coordinates unique assignment/group result | SATISFIED | `service/impl/AssignmentResultServiceImpl.java` | Keep persistence coordination in service. |
| `ResultAppeal` | `ResultAppealServiceImpl` | Service or `AssignmentResult.createAppeal(...)` | Yes; service also needs membership and uniqueness queries | SATISFIED | `service/impl/ResultAppealServiceImpl.java` | Parent helper is optional; fix deep navigation before the deferred appeal API. |
| Login/current-user DTOs | `AuthMapper` | `AuthMapper` | Yes | SATISFIED | `mapper/AuthMapper.java` | Keep DTO construction out of controller/entity. |
| JWT string | `JwtTokenProvider` | `JwtTokenProvider` | Yes | SATISFIED | `security/JwtTokenProvider.java` | Keep token creation in security infrastructure. |
| `ErrorResponse` | `ErrorResponse` factory invoked by exception/security handlers | `ErrorResponse` factory plus HTTP handlers | Yes | SATISFIED | `common/response/ErrorResponse.java`; `GlobalExceptionHandler`; `RestAuthenticationEntryPoint`; `RestAccessDeniedHandler` | Preserve one response format. |
| `CourseEnrollment` | No implemented creation flow | `Course`/enrollment service depending on invitation and uniqueness rules | N/A | NOT_IMPLEMENTED_YET | Entity and DAO only | Decide after Join Course sequence mapping. |
| `AssignmentSubmission` | No implemented creation flow | `Assignment` helper or submission service | N/A | NOT_IMPLEMENTED_YET | Entity and DAO only | Parent helper is useful if assignment deadline/status invariants are enforced atomically. |
| `SubmissionAttachment` | No implemented creation flow | `AssignmentSubmission.addAttachment(...)` | N/A | NOT_IMPLEMENTED_YET | Entity and DAO only | Prefer submission-owned creation if attachment limits/type rules exist. |
| `PeerReview` | No implemented creation flow | `PeerReviewAssignment.submitReview(...)` or review service | N/A | NOT_IMPLEMENTED_YET | Entity and DAO only | Use a parent helper if it protects one-review/status-transition rules. |

**Creator conclusion:** Current creation is reasonable for a layered Spring application. Services create persisted entities because they hold use-case inputs and coordinate DAOs; this is not automatically a Creator violation. Mappers and JWT infrastructure are particularly clear Creator examples.

# 5. High Cohesion Audit

| Class | Main responsibility | Good cohesion evidence | Weak cohesion evidence | Status | Recommendation |
|---|---|---|---|---|---|
| `AuthController` | Adapt login/current-user HTTP requests | Two auth endpoints delegate to `AuthService`; no DAO/password/JWT logic | Principal type guard is adapter logic, not domain logic | SATISFIED | Keep future unrelated account administration elsewhere. |
| `AuthServiceImpl` | Orchestrate authentication and current-user retrieval | Dependencies all support authentication: user lookup, password, JWT, mapper | Contains small account-state predicates that could be domain queries | PARTIAL | Reuse `User` state helpers, but do not split the service prematurely. |
| `JwtAuthenticationFilter` | Authenticate a bearer token for each request | Token extraction, validation, user reload, account checks, and security context all support one filter purpose | Security hardening makes the method moderately involved | SATISFIED | Keep it focused; extract a helper only when complexity or reuse materially grows. |
| `JwtTokenProvider` | Generate and parse JWTs | JWT configuration and library operations are isolated | No unrelated business behavior found | SATISFIED | Maintain focused unit tests around token edge cases. |
| `CustomUserDetailsService` | Reload users for Spring Security | Single DAO-backed lookup purpose | No unrelated behavior found | SATISFIED | No change. |
| `RestAuthenticationEntryPoint` | Serialize unauthenticated errors | One HTTP security error concern | No unrelated behavior found | SATISFIED | No change. |
| `RestAccessDeniedHandler` | Serialize forbidden errors | One HTTP security error concern | Similar serialization exists in the entry point | SATISFIED | Shared serializer is optional only if duplication grows. |
| `GlobalExceptionHandler` | Translate application exceptions to API errors | Handler methods all serve one cross-cutting HTTP error abstraction | It covers several exception types, but that is inherent to the abstraction | SATISFIED | Keep business decisions out of it. |
| `SecurityConfig` | Wire security policy and beans | URL authorization, CORS, filters, handlers, and encoder are configuration concerns | None of the inspected code is domain business logic | SATISFIED | Keep endpoint-specific business authorization in services/method security later. |
| `AuthMapper` | Map security/domain user data to auth DTOs | DTO construction is centralized | Dashboard-path selection is a small navigation policy | PARTIAL | Accept for MVP; move to a resolver/frontend if navigation policy expands. |
| `CourseServiceImpl` | Course foundation operations | Focused on course concerns | Use case is incomplete, so future growth cannot be assessed | SATISFIED | Reassess when course management endpoints are added. |
| `GroupServiceImpl` | Group creation/membership foundation | Group-related DAOs and rules are grouped coherently | Owns a domain-local capacity comparison | PARTIAL | Delegate the local predicate to `StudentGroup`. |
| `LessonServiceImpl` | Lesson foundation operations | Focused on lessons | No current controller flow | SATISFIED | Reassess with Manage Course/Lesson API. |
| `AssignmentServiceImpl` | Assignment foundation operations | Focused on assignment lifecycle data | Duplicates entity deadline-ordering rule | PARTIAL | Use the entity predicate. |
| `AssignmentResultServiceImpl` | Result foundation operations | Focused on score/result persistence | Duplicates entity score predicate | PARTIAL | Use the entity predicate. |
| `ResultAppealServiceImpl` | Appeal foundation operations | All behavior concerns appeals | Deep relationship traversal expands knowledge of neighboring aggregates | PARTIAL | Introduce a focused ownership query before appeal endpoints are implemented. |

No current class qualifies as a god class. The foundation services are separate by domain rather than accumulated into one generic service.

# 6. Low Coupling Audit

## Layer Dependency Table

| Source class/package | Dependencies | Expected? | Status | Notes |
|---|---|---|---|---|
| `controller` | Service interfaces, request/response DTOs, `ApiResponse`, authenticated principal | Yes | SATISFIED | No controller -> DAO dependency was found. |
| `service/impl` | DAO interfaces, entities, mapper, password/JWT utilities, exceptions | Yes | SATISFIED | These are normal orchestration dependencies; local entity rules should still be delegated. |
| `dao` | JPA/Spring Data and entities | Yes | SATISFIED | No DAO -> service/controller dependency was found. |
| `entity` | JPA, Lombok, enums, Java date/time | Yes | SATISFIED | No entity dependency on controller, DTO, HTTP, JWT, or Spring Security was found. |
| `mapper` | Auth DTOs, `User`, and `CustomUserPrincipal` | Mostly | PARTIAL | Security principal mapping is expected; dashboard-path selection is minor presentation-policy coupling. |
| `security` | Spring Security, `UserDao`, user/entity data, JWT/Jackson, common error response | Yes | SATISFIED | Framework coupling is contained in the security adapter layer and does not leak into entities. |
| `exception` | Spring MVC validation/HTTP and common error response | Yes | SATISFIED | Cross-cutting API translation is isolated. |
| Implemented API responses | DTOs wrapped in `ApiResponse` | Yes | SATISFIED | UC-01 does not expose a JPA entity directly. Foundation services returning entities are not currently API endpoints. |

## Coupling Risks

| Risk | Evidence | Impact | Recommendation |
|---|---|---|---|
| Deep “talk to strangers” chain in appeal ownership logic | `ResultAppealServiceImpl`: `appeal.getAssignmentResult().getAssignment().getLesson().getCourse().getLecturer()` | Couples appeal service to five object structures, risks lazy-loading failures, and makes model changes ripple | Add a focused DAO ownership query or aggregate query method before the appeal use case is exposed. |
| Smaller nested navigation in group/result services | Examples include `group.getCourse().getId()` and `result.getGroup().getId()` | Low current impact, but repeated chains can spread | Prefer direct query parameters/IDs or intention-revealing entity methods when chains grow. |
| Domain-local validation performed through getters | Assignment deadlines, score, and group capacity are read by services | Increases getter use and duplicates rules | Ask the information-owning entity to answer the local question. |
| Broad Lombok setters on entities | Entity classes commonly use generated setters | Public mutation can bypass invariants as behavior grows | Do not remove mechanically now; gradually narrow mutation when implementing lifecycle rules. |
| Backend mapper chooses `dashboardPath` | `AuthMapper` maps role to navigation path | Couples an API response to current UI route policy | Accept for MVP; relocate only if frontend navigation becomes independent or role routing grows. |
| No automated architecture-boundary test | Current tests verify behavior, not forbidden package dependencies | A future controller could accidentally inject a DAO without immediate failure | Optionally add ArchUnit or lightweight package-dependency tests later. |

No public mutable entity fields were found; entity state is private. Generated accessors are wider than a strict domain model would ideally expose, but this is a maintainability note rather than a current correctness failure.

# 7. Controller Audit

| Controller | Endpoint responsibility | Delegates to service? | Avoids DAO/database? | Avoids business rules? | Avoids frontend logic? | DTO/API response? | Status | Recommendation |
|---|---|---|---|---|---|---|---|---|
| `AuthController` | `POST /auth/login`, `GET /auth/me` under `/api` context path | Yes, to `AuthService` | Yes | Yes; principal guard is API/security adaptation | Yes | Yes, `LoginResponse`/`CurrentUserResponse` wrapped by `ApiResponse` | SATISFIED | Keep additional account-management use cases in separate controllers/services as needed. |
| `HealthController` | `GET /health` technical liveness response | No service, appropriately | Yes | Yes | Yes | Returns a small map rather than the shared response wrapper | SATISFIED | A service would add no business value; response consistency is optional and not a GRASP defect. |
| Other use-case controllers | None present | N/A | N/A | N/A | N/A | N/A | NOT_IMPLEMENTED_YET | Add each only after its sequence-to-code responsibilities are agreed. |

The Controller pattern is satisfied for UC-01. Naming a class `Controller` was not taken as proof; the inspected dependency and method flow show actual delegation.

# 8. UC-01 Login GRASP Trace

Runtime flow: `AuthController -> AuthServiceImpl -> UserDao -> app_users -> BCrypt -> JwtTokenProvider -> AuthMapper -> ApiResponse`

| Object | Responsibility | GRASP support | Why placed here | Assessment |
|---|---|---|---|---|
| `AuthController` | Receive/validate HTTP request shape, delegate login/me, return API envelope | Controller, High Cohesion, Low Coupling | It is the boundary between React/Postman and application logic | SATISFIED. It has no DAO, BCrypt, or JWT creation logic. |
| `AuthServiceImpl` | Coordinate user lookup, credential check, account/role checks, token creation, and mapping | Controller-service separation; partial Expert | It has the collaborators and use-case context required for login | SATISFIED as orchestrator, PARTIAL as Expert because simple account-state facts can be asked of `User`. |
| `User` | Hold username/email, password hash, role, and account status | Expert | It owns account state, so simple queries such as active and assigned-role belong here | PARTIAL. `isActive()` exists, but login still reads raw status/role. JWT/DAO/HTTP logic must not move here. |
| `UserDao` | Find `User` by username or email | Low Coupling, High Cohesion | It is the persistence gateway and Spring Data query owner | SATISFIED. It performs data access only. |
| `app_users` | Persist account facts and BCrypt hash | Persistence responsibility | A table stores durable state; it does not make business decisions | SATISFIED. Database naming does not alter GRASP responsibility. |
| `PasswordEncoder` | Compare raw login password with BCrypt hash | Expert | The security component knows the encoding algorithm | SATISFIED. Neither controller nor entity implements BCrypt. |
| `JwtTokenProvider` | Create/parse/validate JWT and determine expiration | Expert, Creator, High Cohesion | It owns JWT configuration and library knowledge | SATISFIED. JWT is infrastructure, not a `User` responsibility. |
| `AuthMapper` | Create auth response DTOs | Creator, High Cohesion | It has source data and destination DTO knowledge | SATISFIED_WITH_NOTE. Dashboard route mapping is a small policy that may move if it grows. |
| `ApiResponse` | Provide the successful API envelope | Creator/representation support | It owns the shared response representation | SATISFIED. Business objects do not serialize the HTTP contract. |

The key defense point is that `AuthServiceImpl` is allowed to handle login because login is a multi-collaborator use case. That does not make it the only Expert. `User` owns local state facts, `PasswordEncoder` owns BCrypt knowledge, `UserDao` owns retrieval, `JwtTokenProvider` owns token mechanics, and `AuthMapper` owns DTO construction.

# 9. Current GRASP Verdict

| Pattern | Verdict | Main evidence | Required action | Optional action |
|---|---|---|---|---|
| Expert | PASS_WITH_NOTES | Correct infrastructure experts, but service code duplicates assignment/result rules and reads simple user/group state | No blocker for UC-01; assign Experts explicitly before each new use case | Reuse/add small domain query methods. |
| Creator | PASS_WITH_NOTES | Services create entities from use-case data; mapper creates DTOs; JWT utility creates tokens | None now | Add parent/aggregate creation helpers only when they protect invariants. |
| High Cohesion | PASS | Auth/security classes and domain services have focused responsibilities; no god class found | None | Reassess as new operations are added. |
| Low Coupling | PASS_WITH_NOTES | Layer direction is clean and entities are framework-domain isolated; appeal service contains one serious deep chain | Fix the deep appeal ownership access before exposing the appeal use case | Add architecture tests and narrow entity mutation gradually. |
| Controller | PASS | `AuthController` delegates to `AuthService`; no controller accesses DAOs or owns business rules | None | Preserve this template for future controllers. |

**Overall verdict: PASS_WITH_NOTES.** The current UC-01 implementation is defensible under GRASP. The foundation shows correct layer boundaries, but the team should improve explicit domain Expert assignment as future use cases are implemented.

# 10. Required Refactors

No immediate refactor is required for UC-01 correctness or for continuing backend planning. The implemented login flow does not contain a GRASP violation that requires a large or urgent rewrite.

One conditional refactor is required **before the deferred appeal use case is exposed through an API**:

| Problem | GRASP affected | Files affected | Exact target design | Acceptance criteria | Test impact |
|---|---|---|---|---|---|
| Appeal authorization navigates through a long object graph | Low Coupling / Law of Demeter; secondarily Expert | `service/impl/ResultAppealServiceImpl.java`, likely `dao/AssignmentResultDao.java` or `dao/ResultAppealDao.java`, related tests | Query the required ownership/course identity directly through a focused DAO method, or expose one intention-revealing aggregate query without leaking the full graph | No five-object getter chain; same authorization behavior; service remains the use-case orchestrator | Update/add service tests for authorized and unauthorized appeal ownership. |

This is not a current production-path failure because appeal controllers are intentionally not implemented. It must not be forgotten when that scope begins.

# 11. Optional Refactors

1. Use or rename `User.isActive()` as `isActiveAccount()` and add `hasAssignedRole()` when reused. Keep exception/status-code decisions in authentication services and adapters.
2. Add `StudentGroup.hasCapacity(int currentMemberCount)` and let `GroupServiceImpl` supply the DAO-derived count.
3. Make `AssignmentServiceImpl` call `Assignment.hasValidReviewDeadline()` rather than duplicate the comparison.
4. Make `AssignmentResultServiceImpl` call `AssignmentResult.hasValidScore()` rather than duplicate the range.
5. Add `Assignment.isSubmissionOpen(now)`, `AssignmentResult.isPublishable()`, and peer-review predicates only when their SRS rules are approved.
6. Move dashboard-path resolution from `AuthMapper` to a small resolver or the frontend only if route policy becomes complex.
7. Gradually replace blanket setters with intention-revealing state-transition methods where lifecycle invariants emerge.
8. Add architecture tests that forbid controller -> DAO, DAO -> service/controller, and entity -> web/security/DTO dependencies.

These are small responsibility improvements, not a recommendation for a domain-model rewrite.

# 12. Recommended `.agent` Rule File

The project should add this file in a separately approved documentation step:

` .agent/rules/grasp-responsibility-assignment-guide.md `

Purpose: prevent future AI-assisted use-case implementation from equating package layering with correct responsibility assignment.

The rule file should require future agents to:

1. Start from the approved use-case description and sequence diagram.
2. List each behavior and identify its Controller, Expert, and Creator before coding.
3. Keep controllers limited to HTTP adaptation, API validation, service delegation, and response construction.
4. Treat services as transaction/use-case orchestrators, not automatic owners of every rule.
5. Put simple rules beside the entity state they inspect, while keeping DAO, JWT, HTTP, serialization, and Spring Security concerns outside entities.
6. Keep DAOs as pure data-access interfaces and never inject services/controllers into them.
7. Use mappers to create API DTOs; do not expose JPA entities as response bodies.
8. Avoid unnecessary associations and long nested getter chains; prefer focused queries and intention-revealing methods.
9. Keep each class focused on one abstraction and split it only when responsibilities become unrelated.
10. Preserve the dependency direction `Controller -> Service/ServiceImpl -> DAO -> Database`.
11. Add behavior tests and, where practical, architecture-boundary tests.
12. Update trace/audit documentation when code intentionally differs from a sequence or class diagram.

Pre-implementation checklist:

- Are all sequence messages mapped to a method owner?
- Which object has the information for each business rule?
- Who should create every new entity/DTO/token/error object?
- Does any controller call a DAO or contain a domain decision?
- Does any entity depend on HTTP, DTO, JWT, Spring Security, or persistence queries?
- Is there a long navigation chain or an unnecessary direct association?
- Does every class still have one coherent purpose?
- Are API contracts DTO-based and globally error-handled?
- Do tests prove the main, alternative, and exception flows?

This audit does not create the rule file because the task explicitly permits only the audit report.

# 13. Viva / Defense Questions

**What is GRASP?**  
GRASP is a set of responsibility-assignment patterns. We use Expert, Creator, High Cohesion, Low Coupling, and Controller to decide which object should perform each behavior, not just where a file should be placed.

**Where is Expert applied in this project?**  
`JwtTokenProvider` owns JWT mechanics, `PasswordEncoder` owns BCrypt matching, `UserDao` owns account retrieval, and domain entities own or should own simple rules based on their own state.

**Which class is the Expert for account status?**  
`User` is the Expert for the factual question about its status. `AuthServiceImpl` and Spring Security adapters decide what that fact means in the login/request flow.

**Why is `AuthServiceImpl` allowed to handle login?**  
Login requires several collaborators: DAO lookup, BCrypt, account and role validation, JWT creation, and DTO mapping. The service coordinates that transaction/use case without absorbing the specialized knowledge of those collaborators.

**Why not put JWT logic in `User`?**  
JWT depends on cryptographic keys, expiration configuration, and a token library. Those are security infrastructure concerns, not information naturally owned by the domain user.

**Where is Creator applied?**  
`AuthMapper` creates response DTOs, `JwtTokenProvider` creates JWTs, and services create persisted entities when they hold the use-case initialization data and coordinate persistence.

**Where is High Cohesion shown?**  
Authentication, JWT mechanics, user loading, security error serialization, mapping, and HTTP control are separated into focused classes instead of one auth god class.

**Where is Low Coupling shown?**  
Controllers depend on services rather than DAOs, entities do not depend on HTTP/security/DTO packages, and DAOs depend only on persistence abstractions and entities.

**Where is Controller applied?**  
`AuthController` receives `/auth/login` and `/auth/me`, delegates to `AuthService`, and returns DTOs in `ApiResponse`. It does not query `app_users` or check passwords itself.

**How do you prove the controller has no business logic?**  
Static inspection shows no DAO or `PasswordEncoder` dependency in `AuthController`; its endpoint methods delegate to `AuthService`. Integration tests exercise the endpoint while service tests exercise login decisions.

**Which GRASP pattern is weakest currently?**  
Expert. Several simple domain-local checks are still written directly in services, even though assignment and result entities already expose relevant predicates. Low Coupling has one additional appeal-navigation risk.

**Does placing code in `ServiceImpl` automatically satisfy Expert?**  
No. A service is often the correct orchestrator, but a rule based only on one entity's state should normally be answered by that entity. Infrastructure and cross-record rules remain in specialized services/adapters.

**Why are future entities not marked as GRASP failures?**  
They are persistence foundations for use cases that have not been implemented. Responsibility placement can only be audited once the behavior exists; until then the status is `NOT_IMPLEMENTED_YET`.

**What will the team do to maintain GRASP?**  
For each use case, map sequence messages to methods, assign Expert and Creator before coding, keep controllers thin, review coupling chains, return DTOs, and add tests. The proposed `.agent` rule makes this repeatable for AI-assisted work.

# 14. Final Recommendation

The current project is acceptable under GRASP with notes. UC-01 Login is suitable for an OOSE defense: it has a real Controller, a focused service orchestrator, specialized security Experts/Creators, a data-only DAO, DTO mapping, and clean persistence separation.

Nothing must be rewritten before continuing. Before any appeal endpoint is implemented, the deep relationship chain in `ResultAppealServiceImpl` should be replaced with a focused ownership query. Domain-local helpers for account state, group capacity, deadlines, and scores are worthwhile small improvements and can be introduced alongside the use cases that need them.

Add `.agent/rules/grasp-responsibility-assignment-guide.md` in the next approved documentation step so future agents assign responsibilities before generating code. React implementation should wait until each backend use-case boundary and API contract is stable; it does not need to wait for every optional domain helper cleanup.
