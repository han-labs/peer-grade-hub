# PeerGrade Hub Facade Pattern Compliance Audit

Audit date: 2026-06-19  
Audit type: Static, evidence-based architecture audit  
Scope: Current backend source, tests, design audits/plans, and `.agent` GRASP guidance

# 1. Facade Pattern Theory

## Problem Solved by Facade

A subsystem usually contains several collaborating classes. For example, login currently needs a DAO, password encoder, JWT provider, mapper, entities, exceptions, and Spring Security adapters. If every caller knows and coordinates all of those classes, the caller becomes tightly coupled to the subsystem's internal design.

Facade provides one public entry point for a coherent subsystem. A caller asks the facade to perform a use case and does not coordinate the internal classes itself. Internal classes can then be changed, replaced, or reorganized with less impact on callers.

## Cross-Package and Cross-Subsystem Communication

Cross-package communication is not automatically wrong. It becomes risky when code in one logical subsystem directly calls several implementation classes, DAOs, or navigates entity graphs belonging to another subsystem. Typical consequences are:

- Changes in one subsystem force changes in several unrelated packages.
- Business rules are duplicated because callers bypass the owning subsystem.
- Controllers become orchestration scripts.
- Internal persistence entities become public contracts.
- Tests require knowledge of many internal collaborators.
- Team members working on different use cases can accidentally break each other's code.

Facade reduces this coupling by offering a small, stable interface based on use-case operations. The facade decides how internal DAOs, domain objects, mappers, and infrastructure collaborate.

## Mapping to Spring Boot

In PeerGrade Hub, a Spring service interface can act as the subsystem facade:

`Controller -> Service interface (facade) -> ServiceImpl -> DAO/domain/infrastructure`

The interface does not need the word `Facade` in its name. It qualifies by behavior when:

1. It is the normal public entry point for the subsystem.
2. Controllers and other subsystems depend on the interface, not the implementation.
3. It exposes cohesive use-case operations.
4. It hides DAOs, persistence coordination, mappers, and technical collaborators.
5. Its public contract does not unnecessarily expose internal JPA graphs.

A Controller is not the same as a Facade. The Controller adapts HTTP requests and responses. The service facade exposes application use cases independently of HTTP. A DAO is also not a facade; it exposes persistence operations rather than a subsystem's business capabilities.

# 2. Subsystems in PeerGrade Hub

The repository currently uses horizontal packages such as `service`, `dao`, and `entity`, so subsystem boundaries are logical rather than enforced by top-level Java packages.

| Logical subsystem | Responsible use cases | Assigned team member | Current classes | Implementation status |
|---|---|---|---|---|
| Auth / Login | UC-01 Login | Gia Han | `AuthController`, `AuthService`, `AuthServiceImpl`, auth DTOs, `AuthMapper`, `UserDao`, JWT/security classes | IMPLEMENTED. Login and current-user endpoints exist and are tested. |
| Course Management | UC-02 Manage Courses; course-side lesson foundation | Tuan Kha | `CourseService`, `CourseServiceImpl`, `LessonService`, `LessonServiceImpl`, `CourseDao`, `LessonDao`, `Course`, `Lesson` | FOUNDATION_ONLY. Services/entities/DAOs exist; no course controller or DTO API exists. |
| Group Management | UC-03 Manage Groups; part of UC-05 Join Course and Group | Tuan Kha for UC-03; Thuy Trang for UC-05 | `GroupService`, `GroupServiceImpl`, `StudentGroupDao`, `GroupMemberDao`, group entities | FOUNDATION_ONLY. Basic service methods exist; no group controller or DTO API exists. |
| Course Enrollment | UC-05 Join Course and Group | Thuy Trang | `CourseEnrollment`, `CourseEnrollmentDao`; group join foundation in `GroupService` | NOT_IMPLEMENTED_YET. Entity/DAO foundation only for course enrollment. |
| Assignment Management | UC-04 Manage Assignments | Ngoc Bich | `AssignmentService`, `AssignmentServiceImpl`, `AssignmentDao`, `Assignment`, lesson relationship | FOUNDATION_ONLY. Service validation and persistence exist; no API facade use is demonstrated by a controller. |
| Submission Management | UC-06 Submit Assignment | Thuy Trang | `AssignmentSubmission`, `SubmissionAttachment`, corresponding DAOs | NOT_IMPLEMENTED_YET. No submission service facade or controller. |
| Peer Review | UC-07 Submit Peer Review; UC-14 Assign Peer Review | Ngoc Bich for UC-07; Gia Han for UC-14 | `PeerReviewAssignment`, `PeerReview`, and corresponding DAOs | NOT_IMPLEMENTED_YET. No peer-review service facade or controller. |
| Final Grade / Results | UC-09 Manage Final Grades; UC-10 View Published Results | To Nhu | `AssignmentResultService`, `AssignmentResultServiceImpl`, `AssignmentResultDao`, `AssignmentResult` | FOUNDATION_ONLY. Result save/update exists; publish/view APIs are not implemented. |
| Progress Monitoring | UC-08 Monitor Progress | Gia Han | No `ProgressService`; data is available across enrollment, group, assignment, submission, review, and result foundations | NOT_IMPLEMENTED_YET. This is the highest future cross-subsystem aggregation risk. |
| Appeal | Deferred UC-11/UC-12 foundation | NEEDS_CONFIRMATION from current assignment list | `ResultAppealService`, `ResultAppealServiceImpl`, `ResultAppealDao`, `ResultAppeal` | FOUNDATION_DEFERRED. Service/tests exist, no controller; known deep ownership chain remains. |

`Gia Han`, `Tuan Kha`, `Thuy Trang`, `Ngoc Bich`, and `To Nhu` above are normalized ASCII renderings of the ownership information supplied for this audit. The repository itself does not provide independently verified ownership metadata, so ownership should be updated if the team allocation changes.

# 3. Current Facade Candidates

| Class/interface | Subsystem | Is it a facade? | Internals hidden | Status | Evidence | Recommendation |
|---|---|---|---|---|---|---|
| `AuthController` | Auth | No; it is the HTTP adapter and facade client | N/A | SATISFIED | Holds `AuthService`, not `UserDao` or JWT implementation; methods delegate `login` and `getCurrentUser` | Keep it as adapter. Do not rename it or treat it as the business facade. |
| `AuthService` | Auth | Yes | `AuthServiceImpl`, `UserDao`, BCrypt, JWT generation, mapper, exceptions | SATISFIED | `AuthController` injects the interface; `AuthServiceImpl.login` coordinates internals | This is the project's strongest Facade example. Consider hiding `CustomUserPrincipal` behind a neutral current-user abstraction only if security coupling spreads. |
| `AuthServiceImpl` | Auth | Facade implementation, not the external contract | DAO, mapper, encoder, JWT provider orchestration | SATISFIED | Implements `AuthService`; controller does not inject implementation | Keep implementation in `service/impl`. |
| `CourseService` | Course | Candidate facade | `CourseDao`, course creation checks | PARTIAL | Interface exists and implementation hides `CourseDao` | When UC-02 is implemented, use request/response DTOs or IDs rather than exposing `Course` and `User` as the external API contract. |
| `LessonService` | Course / Lesson | Candidate focused facade | `LessonDao`, lesson construction | PARTIAL | Interface/implementation boundary exists | It may remain a separate cohesive facade or be called behind a course-management facade; do not merge only for pattern appearance. |
| `GroupService` | Group | Candidate facade | `StudentGroupDao`, `GroupMemberDao`, group capacity and membership orchestration | PARTIAL | Interface hides two DAOs and implementation rules | Replace entity-heavy public signatures with use-case DTOs/IDs when controllers are added. Keep group membership rules behind this boundary. |
| `AssignmentService` | Assignment | Candidate facade | `AssignmentDao`, entity construction and deadline validation | PARTIAL | Interface hides DAO and implementation | Use as UC-04 entry point, but avoid making external callers supply managed `Lesson`/`Assignment` entities. |
| `AssignmentResultService` | Final Grade / Results | Candidate facade | `AssignmentResultDao`, create/update result logic | PARTIAL | Interface hides DAO; no controller uses it | Evolve into a final-grade use-case facade with DTO/ID inputs and publish/view operations owned by the appropriate cohesive service. |
| `ResultAppealService` | Appeal | Candidate facade | `ResultAppealDao`, `GroupMemberDao`, appeal workflow | PARTIAL | Interface exists, but implementation reaches directly into group data and a deep entity graph | Keep deferred. Before an appeal API exists, replace cross-subsystem internals with focused query/facade boundaries. |
| `HealthController` | Technical health | No business facade needed | N/A | SATISFIED | Returns technical liveness data and accesses no DAO | A service facade would add no value for this technical endpoint. |
| `CustomUserDetailsService` | Auth security internals | Internal Spring Security adapter, not public subsystem facade | `UserDao` from the filter/framework | SATISFIED | Implements Spring `UserDetailsService`; used by JWT authentication | Keep internal to auth/security callers. External business subsystems should use `AuthService` or a focused identity/access interface. |
| Submission service | Submission | No current facade | Nothing | NOT_IMPLEMENTED_YET | No `SubmissionService` exists | Add a focused service interface during UC-06 sequence-to-code implementation. |
| Peer-review assignment service | Peer Review | No current facade | Nothing | NOT_IMPLEMENTED_YET | Entities/DAOs exist; no service | Add `PeerReviewAssignmentService` or similarly cohesive interface for UC-14. |
| Peer-review submission service | Peer Review | No current facade | Nothing | NOT_IMPLEMENTED_YET | Entities/DAOs exist; no service | Add `PeerReviewService` for UC-07 if its operations are cohesive and distinct from assignment generation. |
| Progress service | Progress | No current facade | Nothing | NOT_IMPLEMENTED_YET | No progress package/service/controller | Add `ProgressService` as the single read-oriented entry point for UC-08. |

The foundation service interfaces are structurally useful facade candidates. Except for `AuthService`, they are not yet proven public subsystem facades because no controllers/use-case flows consume them and their signatures expose JPA entities.

# 4. Cross-Subsystem Communication Audit

| Source class | Target class/package | Cross-subsystem? | Acceptable? | Preferred boundary | Risk | Recommendation |
|---|---|---|---|---|---|---|
| `AuthController` | `AuthService` | API -> Auth subsystem | Yes | Service facade | Low | Preserve this model for future controllers. |
| `AuthController` | `CustomUserPrincipal` through Spring `Authentication` | API -> Security internals | Yes, as an HTTP/security adapter | Current security principal or future neutral current-user context | Low to medium | Accept for UC-01. Avoid passing this security type into unrelated domain services. |
| `AuthServiceImpl` | `UserDao`, `JwtTokenProvider`, `AuthMapper`, `PasswordEncoder` | Internal Auth collaboration | Yes | Internal classes behind `AuthService` | Low | This is valid facade implementation orchestration. |
| `CustomUserDetailsService` | `UserDao` | Security -> Auth persistence | Yes, internal authentication path | Internal security adapter | Low | Keep external callers away from `CustomUserDetailsService`. |
| `JwtAuthenticationFilter` | Concrete `CustomUserDetailsService` | Internal security coupling | Mostly | `UserDetailsService` abstraction could be used | Low | Optional abstraction improvement; no facade violation in current scope. |
| `JwtTokenProvider` | `User` entity | Security -> Auth domain | Acceptable for current token creation | Narrow claims input or principal if contract grows | Low | Do not let other subsystems call the token provider directly. |
| `CourseServiceImpl` | `User` lecturer entity | Course -> Identity/Auth domain data | Acceptable domain association, but public signature is coupled | Course facade accepting lecturer ID/request DTO | Medium for future API | Resolve lecturer inside the use-case boundary instead of requiring controllers to load a `User`. |
| `LessonServiceImpl` | `Course` entity | Lesson -> Course | Acceptable if lesson is treated as course-management internals | `LessonService`/course-management facade with course ID | Low to medium | Keep course ownership checks inside a service boundary. |
| `GroupServiceImpl` | `Course`, `User`, `StudentGroupDao`, `GroupMemberDao` | Group -> Course/Identity plus group persistence | Partially acceptable | `GroupService` facade; focused ID/query collaborators internally | Medium | Do not make controllers load entities from other DAOs. Add focused course/student checks inside the facade implementation. |
| `AssignmentServiceImpl` | `Lesson` entity | Assignment -> Course/Lesson | Domain relationship is expected; public contract is coupled | Assignment facade accepting lesson ID/request DTO | Medium | Resolve and authorize the lesson inside the use case when UC-04 API is built. |
| `AssignmentResultServiceImpl` | `Assignment`, `StudentGroup`, `AssignmentResultDao` | Results -> Assignment/Group | Necessary cross-domain workflow, but entity input leaks internals | Final-grade facade plus focused queries/IDs | Medium | Controller should call one result/final-grade facade, not load assignment and group through separate DAOs. |
| `ResultAppealServiceImpl` | `GroupMemberDao` | Appeal -> Group persistence internals | Not ideal | Group membership query facade/service or focused application query | Medium | Before UC-11/UC-12, stop bypassing the group subsystem's public boundary for membership semantics. |
| `ResultAppealServiceImpl` | `appeal -> result -> assignment -> lesson -> course -> lecturer` | Appeal -> Results/Assignment/Course object graph | No, as a stable subsystem boundary | Focused ownership query/facade | High | This is the clearest current Facade/Low Coupling risk. Keep documented and refactor before exposing appeal endpoints. |
| Current controllers | DAO package | API -> persistence internals | No such dependency found | Service interface | None currently | Enforce with review or architecture tests. |
| DAO interfaces | Service/controller packages | Persistence -> upper layers | No such dependency found | N/A | None currently | Preserve pure data-access direction. |
| JPA entities | Cross-domain JPA relationships | Persistence/domain model relationships | Generally acceptable | Entity association for persistence; facade for use-case calls | Medium if navigated deeply | Relationships do not authorize services to use long chains as subsystem APIs. |
| Future UC-08 controller | Multiple course/group/submission/review/result DAOs | Progress -> many persistence internals | Would be a violation | `ProgressService` facade | High future risk | Controller calls one progress facade. The facade may use focused read/projection queries without duplicating other subsystem rules. |
| Future `ProgressServiceImpl` | Multiple read DAOs/projection queries | Progress -> persisted data | Acceptable when read-only aggregation is its responsibility | Dedicated query facade/read model | Medium | Direct DAO reads are acceptable for reporting facts; call another service interface when relying on that subsystem's business decision. |
| Future UC-14 controller | Assignment, group, and peer-review DAOs | API -> multiple subsystems | Would be a violation | `PeerReviewAssignmentService` facade | High future risk | Controller supplies a request DTO; one service validates assignment/groups and persists assignments. |
| Future `PeerReviewAssignmentServiceImpl` | Assignment/group data and peer-review DAO | Peer Review -> Assignment/Group | Necessary, but must be focused | Focused DAO queries or other service interfaces | Medium | Use IDs and explicit same-course/self-review queries; avoid entity chains and never inject another `ServiceImpl` directly. |

## Direct DAO Access Rule

Direct DAO access inside a `ServiceImpl` is acceptable when the DAO is part of that facade's implementation and the service owns the use-case decision. It is also acceptable for a dedicated read facade such as progress monitoring to use focused projection queries.

Direct access is not acceptable when it bypasses business behavior owned by another subsystem. In that case, call the other subsystem's service interface or introduce a small focused query/access interface. The deciding question is not package name alone; it is whether the caller is reading data or reimplementing another subsystem's policy.

# 5. Facade Compliance Verdict

| Subsystem | Verdict | Main evidence | Required action | Optional action |
|---|---|---|---|---|
| Auth / Login | PASS | `AuthController -> AuthService`; implementation hides DAO, BCrypt, JWT, mapper, and exceptions | None | Reduce `CustomUserPrincipal` exposure only if it spreads beyond auth/API adapters. |
| Course Management | NOT_IMPLEMENTED_YET | `CourseService` and `LessonService` are facade candidates; no controller/DTO use-case API | Use service interfaces as controller entry points when UC-02 is implemented | Consider whether lesson operations remain a focused facade or are coordinated by course management. |
| Group Management | NOT_IMPLEMENTED_YET | `GroupService` hides two DAOs but exposes `Course`, `User`, and group entities | Keep controllers away from DAOs and move API contracts to DTOs/IDs | Add focused membership query capability for cross-subsystem callers. |
| Course Enrollment | NOT_IMPLEMENTED_YET | Entity/DAO only | Add a cohesive enrollment/join facade for UC-05 | Coordinate group join behind service interfaces rather than in controller. |
| Assignment Management | NOT_IMPLEMENTED_YET | `AssignmentService` boundary exists but only foundation behavior and entity signatures | Make controller depend on the interface and resolve lesson/assignment internally | Keep `LessonService` separate unless a real orchestration need justifies calling it. |
| Submission Management | NOT_IMPLEMENTED_YET | Entity/DAO foundation only | Add `SubmissionService` during UC-06 design | Keep attachments internal to submission facade. |
| Peer Review | NOT_IMPLEMENTED_YET | Entities/DAOs only | Add focused service facade(s) for UC-07 and UC-14 | Separate assignment generation from review submission if that improves cohesion. |
| Final Grade / Results | NOT_IMPLEMENTED_YET | `AssignmentResultService` candidate exists; publish/view flows absent | Expose UC-09/UC-10 through result/final-grade service interfaces | Use response projections for published results. |
| Progress Monitoring | NOT_IMPLEMENTED_YET | No facade; requires several data areas | Add `ProgressService` as one read-oriented entry point | Use a dedicated progress projection/query DAO where useful. |
| Appeal | NOT_IMPLEMENTED_YET | Candidate facade exists, but implementation bypasses group boundary and deeply navigates entities | Refactor focused membership/ownership access before UC-11/UC-12 endpoints | Keep the subsystem deferred until requirements are approved. |

**Current implemented-scope verdict: PASS_WITH_NOTES.** UC-01 demonstrates Facade correctly. The project-wide foundation is promising but cannot claim complete Facade compliance for use cases that are not implemented.

# 6. Should We Add Explicit Facade Classes?

## Decision

Do not add a parallel set of classes named `*Facade` merely to demonstrate the pattern. Existing service interfaces are sufficient when they are treated as subsystem entry points and hide their implementations.

Renaming `AuthService` to `AuthFacade`, or wrapping it in an `AuthFacade` that only delegates every method, would add ceremony without reducing coupling. The defense should explain that the service interface plays the Facade role in this Spring architecture.

## Future Focused Facades

Create service interfaces only where a real use-case boundary is needed:

- `ProgressService` for UC-08 read-only aggregate views.
- `PeerReviewAssignmentService` for UC-14 assignment generation/validation.
- `PeerReviewService` for UC-07 review submission if separate cohesion is useful.
- `SubmissionService` for UC-06 submission and attachment coordination.
- A final-grade/result service boundary for UC-09 and UC-10; exact naming should follow the approved sequence diagrams.
- A course enrollment/join service for UC-05 if `GroupService` alone does not coherently own both enrollment and group membership.

Avoid a global `PeerGradeFacade` or one facade per entity. Facades should follow cohesive subsystem/use-case boundaries, not table count.

# 7. Required Refactors

No immediate refactor is required for the implemented UC-01 flow. It already uses `AuthService` as the facade and has no controller-to-DAO access.

The following is conditionally required before deferred functionality is exposed:

| Timing | Problem | Required target | Acceptance criteria |
|---|---|---|---|
| Before UC-11/UC-12 appeal endpoints | `ResultAppealServiceImpl` accesses `GroupMemberDao` and traverses result/assignment/lesson/course/lecturer internals | Use a focused membership and course-ownership query/service boundary | No deep ownership chain; no appeal controller/consumer coordinates group/course internals; existing appeal outcomes remain tested. |
| Before each new controller | Foundation service contract exposes entities or no service facade exists | Define a cohesive service-interface facade with request/response DTOs or IDs | Controller injects service interface only; no DAO/`ServiceImpl` injection; no JPA entity returned as API response. |

These are boundary requirements for future implementation, not reasons to rewrite current foundation code now.

# 8. Optional Refactors

1. Introduce a focused group membership query method/interface for legitimate cross-subsystem authorization checks.
2. Use IDs or small command/query DTOs at public service boundaries instead of requiring callers to supply managed entities.
3. Keep direct DAO use inside a reporting facade only for focused read/projection queries.
4. Depend on `UserDetailsService` rather than concrete `CustomUserDetailsService` inside the JWT filter if multiple implementations or easier isolation become useful.
5. Add architecture tests that forbid controller -> DAO, controller -> `service.impl`, DAO -> service/controller, and unrelated subsystem -> `service.impl` dependencies.
6. Add package-level documentation identifying which service interface is the public entry point for each subsystem.
7. Keep the existing GRASP rule and add a separate Facade rule so object responsibility and subsystem communication remain distinct review questions.

# 9. Recommended `.agent` Facade Rule File

Add the following file in a separately approved documentation step:

`.agent/rules/facade-subsystem-communication-guide.md`

## Proposed Purpose

Ensure every new use case exposes one cohesive subsystem entry point and prevents controllers or neighboring subsystems from coordinating internal DAOs, entities, mappers, and implementation classes.

## Proposed Subsystem Boundary Rules

1. Identify the owning subsystem from the use case and sequence diagram before coding.
2. Define the public service interface that acts as the subsystem facade.
3. Controllers may depend on service interfaces, never DAOs or `ServiceImpl` classes.
4. Other subsystems may depend on the owning service interface or a focused query/access interface, never its implementation.
5. Keep DAOs, mappers, entity construction, and technical collaborators behind the facade.
6. Use request/response DTOs or IDs at external boundaries; do not expose JPA entities as API responses.
7. Do not create a wrapper named `Facade` when it only duplicates an existing service interface.
8. Do not create a single application-wide mega-facade.
9. Avoid long nested getter chains as a substitute for a subsystem query.
10. Document intentional cross-subsystem data access and why it does not bypass another subsystem's business rule.

## When to Call Another Service/Facade

Call another subsystem's service interface when the needed answer includes that subsystem's business policy, authorization, lifecycle, or invariant. Examples include deciding whether a group may accept a member or whether a result may be published.

## When Direct DAO Access Is Acceptable

Direct DAO access is acceptable inside the owning service implementation for persistence and focused data checks. A dedicated reporting/progress facade may use projection DAOs for read-only aggregation. It must not copy another subsystem's business rules from raw rows.

## Proposed Anti-Patterns

- Controller injects two or more DAOs to implement a use case.
- Controller injects a `ServiceImpl` concrete class.
- One subsystem imports another subsystem's implementation class.
- Caller loads several entities and passes them to a facade only so the facade can act.
- Service traverses `a.getB().getC().getD()` to obtain authorization or ownership facts.
- Public API returns a JPA entity.
- A `*Facade` class merely forwards every call to an identically shaped service.
- A mega-facade accumulates unrelated course, group, assignment, review, and grade operations.

## Proposed Pre-Coding Checklist

- [ ] The use case has one identified owning subsystem.
- [ ] The Controller calls one primary service facade for the use case.
- [ ] Every cross-subsystem dependency is classified as data access or business-policy access.
- [ ] Business-policy access goes through the owning service/focused interface.
- [ ] Direct DAO access remains inside a justified service implementation.
- [ ] No controller imports a DAO or `service.impl` class.
- [ ] No neighboring subsystem imports an implementation class.
- [ ] Public API contracts use DTOs rather than entities.
- [ ] No long nested getter chain crosses subsystem boundaries.
- [ ] Tests cover the facade contract and its alternative/error flows.
- [ ] Sequence-to-code documentation names the facade method.
- [ ] Full tests run before completion is reported.

The existing `.agent/rules/grasp-responsibility-assignment-guide.md` already prohibits controller-to-DAO calls and deep getter chains. The proposed file adds the missing subsystem-entry-point and cross-subsystem policy rules.

# 10. Viva / Defense Questions

**What is Facade Pattern?**  
Facade provides one simple public entry point to a more complex subsystem. Callers use the facade without knowing its DAOs, mappers, entities, or technical collaborators.

**Where is Facade applied in PeerGrade Hub?**  
The clearest implemented example is `AuthService`. `AuthController` calls that interface, while `AuthServiceImpl` hides user lookup, BCrypt, JWT creation, validation, mapping, and exceptions.

**Is `AuthService` a Facade?**  
Yes. In Spring Boot, a service interface can play the Facade role. The pattern is defined by responsibility and dependency direction, not by requiring the class name `AuthFacade`.

**Is Controller the same as Facade?**  
No. Controller adapts HTTP. Facade exposes application/subsystem operations. The Controller is a client of the facade.

**Why should controllers not call DAOs?**  
That would expose persistence internals, force controllers to coordinate business rules, and make database or subsystem changes affect the API layer directly.

**How does Facade reduce coupling?**  
Callers depend on a small service contract. Internal DAOs, mappers, security utilities, and workflows can change without changing every controller or neighboring subsystem.

**Why not add classes named `Facade` everywhere?**  
The current service interfaces can already perform that role. A duplicate forwarding wrapper would add code without hiding additional complexity or improving the contract.

**How will UC-08 Monitor Progress use Facade?**  
Its controller should call one `ProgressService`. That facade can coordinate focused read/projection queries across enrollment, groups, submissions, reviews, and results, returning a progress DTO rather than exposing those internal entities.

**How will UC-14 Assign Peer Review avoid cross-subsystem coupling?**  
Its controller should call `PeerReviewAssignmentService` with a request DTO/IDs. The implementation performs focused assignment/group validation and uses `PeerReviewAssignmentDao`; the controller must not coordinate three DAOs itself.

**Can a service use more than one DAO and still be a Facade?**  
Yes. Hiding multiple internal collaborators is a main reason to use Facade. The service must own the use case and must not bypass another subsystem's business policy.

**Which part still needs attention?**  
The deferred appeal service reaches directly into group persistence and traverses a long result-to-course ownership chain. Future progress and peer-review assignment flows also need explicit facade boundaries before coding.

**How can we prove Facade compliance?**  
Show the dependency flow and tests: Controller injects a service interface, the implementation owns orchestration, DAOs stay internal, API contracts use DTOs, and no controller imports a DAO or implementation class.

# 11. Final Recommendation

The current project is acceptable under Facade Pattern for its implemented scope, with an overall verdict of **PASS_WITH_NOTES**.

UC-01 is defensible: `AuthService` is a real subsystem facade, not merely a renamed layer. It hides the collaborating auth, persistence, mapping, and security classes from `AuthController`. Current controllers do not access DAOs, and DAOs do not depend upward on services/controllers.

The remaining subsystem interfaces are useful foundations but should not be presented as completed Facade implementations. Their use cases are not implemented, and their current entity-based method signatures are not yet suitable as stable external/API contracts.

Before future use cases are coded, enforce these rules:

- One primary service-interface facade per cohesive use case/subsystem entry point.
- No Controller -> DAO or Controller -> `ServiceImpl` dependency.
- Cross-subsystem business decisions go through service/focused interfaces.
- Focused read DAOs are allowed inside reporting/application services, not controllers.
- DTO/ID boundaries replace entity exposure at APIs.
- Deep entity navigation is not used as a subsystem API.

Add `.agent/rules/facade-subsystem-communication-guide.md` now in the next approved rules/documentation step. Do not add decorative `*Facade` wrappers or a global mega-facade. React UI work should consume stable backend API contracts only after each use-case facade boundary is defined.
