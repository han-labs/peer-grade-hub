# PeerGrade Hub

**Peer review assessment management system for HCM-UTE courses.**

**Tech Stack:**
- Backend: Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA, Flyway, MySQL
- Frontend: React 19, Vite
- Database: MySQL 8.0 (Docker Compose)

## Quick Start

### Prerequisites
- Git, Java 17, Node.js 22+, npm, Docker Desktop

### 1️. Setup Environment
```powershell
copy .env.example .env
# Edit .env if needed. Default values work locally.
```

### 2️. Start Database
```powershell
docker compose up -d mysql
```

### 3️. Start Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Backend runs at: `http://localhost:8080/api`  
Health check: `GET http://localhost:8080/api/health`

### 4️. Start Frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

## Key Commands

```powershell
# Backend tests (no MySQL needed, uses H2 in MySQL mode)
cd backend
.\mvnw.cmd test

# Frontend lint & build
cd frontend
npm run lint
npm run build

# Stop everything
docker compose down
```

## Project Structure

```
backend/           Spring Boot API
frontend/          React app
docs/              SRS, diagrams, notes
deployment/        Docker & deploy guides
db/migration/      Flyway migration scripts
```

## Database Migrations

Flyway manages schema at: `backend/src/main/resources/db/migration`

**Current:** `V1__init_schema.sql`

**Rules:**
- Before pushing: migrations are editable
- After pushing: create new migration (e.g., `V2__create_courses.sql`)
- Keep `spring.jpa.hibernate.ddl-auto=validate`

## Timezone ⏰
Always use `Asia/Ho_Chi_Minh`.

## Team Workflow

```powershell
git checkout main
git pull origin main
git checkout -b feature/short-description

# ... make changes ...

# Run checks
cd backend && .\mvnw.cmd test
cd ../frontend && npm run lint && npm run build

git add .
git commit -m "feature: description"
git push origin feature/short-description
# Then open PR
```

## Deployment Notes

See `deployment/` folder for details (moved to later phase).

---
