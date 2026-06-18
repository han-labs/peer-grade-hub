# UC-01 Auth Login API

Backend context path: `/api`

## Login

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

### Request

```json
{
  "usernameOrEmail": "student01",
  "password": "Student@123",
  "rememberMe": false
}
```

`usernameOrEmail` accepts either the username or email address. `rememberMe` is optional; when true, the JWT uses the longer remember-me expiration.

### Success Response

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 3,
      "username": "student01",
      "email": "student01@peergrade.test",
      "fullName": "Demo Student",
      "role": "STUDENT",
      "status": "ACTIVE"
    },
    "dashboardPath": "/student"
  },
  "timestamp": "2026-06-18T02:30:00"
}
```

## Current User

```http
GET http://localhost:8080/api/auth/me
Authorization: Bearer <token-from-login>
```

### Success Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 3,
    "username": "student01",
    "email": "student01@peergrade.test",
    "fullName": "Demo Student",
    "role": "STUDENT",
    "status": "ACTIVE"
  },
  "timestamp": "2026-06-18T02:31:00"
}
```

## Error Examples

### Missing Credentials

```json
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "Username and password are required. Please enter your login information.",
  "path": "/api/auth/login",
  "timestamp": "2026-06-18T02:30:00"
}
```

### Invalid Credentials

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Login failed. Please check your username or password and try again.",
  "path": "/api/auth/login",
  "timestamp": "2026-06-18T02:30:00"
}
```

### Locked Or Inactive

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Your account is locked or inactive. Please contact the administrator.",
  "path": "/api/auth/login",
  "timestamp": "2026-06-18T02:30:00"
}
```

### No Assigned Role

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Your account does not have an assigned role. Please contact the administrator.",
  "path": "/api/auth/login",
  "timestamp": "2026-06-18T02:30:00"
}
```

## Demo Accounts

| Role | Username | Email | Password |
|---|---|---|---|
| Administrator | `admin01` | `admin01@peergrade.test` | `Admin@123` |
| Lecturer | `lecturer01` | `lecturer01@peergrade.test` | `Lecturer@123` |
| Student | `student01` | `student01@peergrade.test` | `Student@123` |

The database stores only BCrypt password hashes in `app_users.password_hash`.
