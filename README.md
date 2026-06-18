# PeerGrade Hub

PeerGrade Hub is a peer review assessment management system for courses.
The current project focus is the backend foundation and use-case-based implementation.

## Tech Stack

Backend:

* Java 17
* Spring Boot
* Spring Data JPA
* Spring Security
* JWT Authentication
* MySQL 8.0
* Flyway
* Maven Wrapper

Tools:

* Docker Desktop
* MySQL Workbench
* Postman
* Git
* IDE: IntelliJ IDEA, VS Code, or another Java IDE

Frontend:

* React is planned, but it is not the current focus yet.

---

## Project Structure

Important backend folders:

```text
backend/src/main/java/.../controller       API endpoints
backend/src/main/java/.../service          Service interfaces
backend/src/main/java/.../service/impl     Business logic implementation
backend/src/main/java/.../dao              Data access layer
backend/src/main/java/.../entity           JPA entities
backend/src/main/java/.../dto              Request/response DTOs
backend/src/main/java/.../mapper           Entity-to-DTO mapping
backend/src/main/java/.../exception        Custom exceptions and handlers
backend/src/main/java/.../security         JWT and Spring Security code
backend/src/main/resources/db/migration    Flyway SQL migrations
```

Private/local files:

```text
.env       local environment configuration
.agent/    AI-agent references, plans, prompts, and audit notes
```

These files are not committed to Git. The team lead will send them separately in the Zalo group.

---

## Required Local Setup

Before running the project, prepare:

1. Install Java 17.
2. Install Docker Desktop and make sure it is running.
3. Install MySQL Workbench for database inspection.
4. Install Postman for API testing.
5. Clone the repository.
6. Put the provided `.env` file at the repository root.
7. Put the provided `.agent/` folder at the repository root if you use AI agents.

The project can run without `.agent/`, but team members should use it when implementing assigned use cases to stay aligned with the design.

---

## Run the Project

From the repository root:

```powershell
docker compose up -d
```

Check that MySQL is running:

```powershell
docker ps
```

Expected container:

```text
peergrade-mysql
0.0.0.0:3307->3306/tcp
```

Then run backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend URL:

```text
http://localhost:8080/api
```

Important ports:

```text
8080 = Spring Boot backend API
3307 = MySQL Docker database
```

---

## Run Tests

From the `backend` folder:

```powershell
.\mvnw.cmd clean test
```

Before pushing code, tests should pass.

---

## Verify Database

Open MySQL Workbench and create a connection:

```text
Host: 127.0.0.1
Port: 3307
Username: peergrade
Password: provided in the team .env file
Default Schema: peergradehub
```

Useful SQL checks:

```sql
SELECT installed_rank, version, script, success
FROM flyway_schema_history;

SELECT username, email, user_role, status
FROM app_users;
```

Expected demo users:

```text
admin01
lecturer01
student01
```

---

## UC-01 Login API

Health check:

```http
GET http://localhost:8080/api/health
```

Login:

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "usernameOrEmail": "student01",
  "password": "Student@123",
  "rememberMe": false
}
```

Current user:

```http
GET http://localhost:8080/api/auth/me
Authorization: Bearer <token>
```

Demo accounts:

| Role          | Username   | Email                                                         | Password     |
| ------------- | ---------- | ------------------------------------------------------------- | ------------ |
| Administrator | admin01    | [admin01@peergrade.test](mailto:admin01@peergrade.test)       | Admin@123    |
| Lecturer      | lecturer01 | [lecturer01@peergrade.test](mailto:lecturer01@peergrade.test) | Lecturer@123 |
| Student       | student01  | [student01@peergrade.test](mailto:student01@peergrade.test)   | Student@123  |

Passwords are stored as BCrypt hashes in the database.

---

## How to Work on an Assigned Use Case

Before coding, do this:

1. Read the assigned use case in the report.
2. Read the related sequence diagram.
3. Check the existing entity/database mapping.
4. Write a short implementation plan.
5. Confirm the expected flow:

```text
Controller -> Service/ServiceImpl -> DAO -> Database
```

When implementing:

1. Add request/response DTOs.
2. Add or update the controller endpoint.
3. Add service interface methods.
4. Implement business rules in `service/impl`.
5. Use DAO for database access.
6. Use mapper when returning response DTOs.
7. Add tests.
8. Update API documentation if needed.

Important rules:

* Do not expose Entity objects directly in API responses.
* Do not put business rules inside Controller.
* Do not call DAO directly from Controller.
* Do not edit old Flyway migrations after they have been shared with the team.
* For database changes, add a new migration: `V3__...sql`, `V4__...sql`, etc.
* Run tests before pushing.

---

## Assigned Use Cases

| Member     | Use Cases                                                     |
| ---------- | ------------------------------------------------------------- |
| Tuấn Kha   | UC-02 Manage Courses, UC-03 Manage Groups                     |
| Thùy Trang | UC-05 Join Course and Group, UC-06 Submit Assignment          |
| Ngọc Bích  | UC-07 Submit Peer Review, UC-04 Manage Assignments            |
| Tố Như     | UC-09 Manage Final Grades, UC-10 View Published Results       |
| Gia Hân    | UC-01 Login, UC-08 Monitor Progress, UC-14 Assign Peer Review |

UC-11, UC-12, and UC-13 are deferred for the current phase unless the team decides otherwise.

---

## Git Workflow

Before starting:

```powershell
git pull origin main
```

Create a branch:

```powershell
git checkout -b branch_name
```

Before committing:

```powershell
cd backend
.\mvnw.cmd clean test
```

Commit example:

```powershell
git add -A
git commit -m "feat: implement UC-xx short description"
```


---

## Troubleshooting

Docker is not running:

```text
Open Docker Desktop first, then run docker compose up -d again.
```

Backend cannot connect to MySQL:

```text
Check that peergrade-mysql is running.
Check that MySQL is exposed on localhost:3307.
```

Opened the wrong URL:

```text
Backend API: http://localhost:8080/api
MySQL database port: 3307
```

SQL does not work in PowerShell:

```text
SQL must be executed inside MySQL Workbench or MySQL shell, not directly in PowerShell.
```

Flyway checksum error:

```text
Do not edit old migration files after they have been applied.
Ask the team before changing migrations.
```

---

## Current Recommended Development Order

1. Keep UC-01 Login stable.
2. Implement backend use cases one by one.
3. For each use case, trace from report and sequence diagram before coding.
4. Add tests and API documentation.
5. Build React UI only after the related backend API is stable.
