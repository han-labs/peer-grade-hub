# UC-09 Manage Final Grades - API Documentation

## Overview
This document describes the API endpoints for **UC-09 Manage Final Grades**.  
Lecturers can view grading data, save drafts, publish/unpublish grades, and toggle Public Showcase Mode.

**Base URL:** `http://localhost:8080/api`  
**Authentication:** Bearer JWT Token (required for all endpoints)

---

## Table of Contents
1. [Get Grading Data](#1-get-grading-data)
2. [Save Grade Draft](#2-save-grade-draft)
3. [Publish Grades](#3-publish-grades)
4. [Unpublish Grade](#4-unpublish-grade)
5. [Toggle Showcase Mode](#5-toggle-showcase-mode)
6. [Exception Flows](#6-exception-flows)
7. [Postman Collection](#7-postman-collection)

---

## 1. Get Grading Data

Load all grading data for an assignment, including submissions, peer reviews, and current grades.

**Endpoint:** `GET /grades/assignment/{assignmentId}`

**Request Headers:**
Authorization: Bearer {{accessToken}}

text

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| assignmentId | Long | ID of the assignment |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "assignmentId": 1,
    "assignmentTitle": "Test Assignment",
    "assignmentDescription": "Test Description",
    "submissionDeadline": "2026-06-30 13:39:36",
    "reviewDeadline": "2026-07-07 13:39:36",
    "showcaseMode": false,
    "groups": [
      {
        "groupId": 1,
        "groupName": "Group A",
        "memberCount": 0,
        "hasSubmission": true,
        "submittedAt": "2026-06-23 13:40:55",
        "submitterName": "Demo Student",
        "hasPeerReview": true,
        "peerReviewCount": 1,
        "peerReviews": [
          {
            "reviewerGroupId": 2,
            "reviewerGroupName": "Group B",
            "score": 90.00,
            "comment": "Excellent work!",
            "submittedAt": "2026-06-23 13:41:36",
            "reviewStatus": "SUBMITTED",
            "anonymousReviewerName": "Group B"
          }
        ],
        "currentFinalScore": 80.00,
        "currentFinalComment": "Draft comment for Group A",
        "isPublished": false,
        "canPublish": true
      }
    ],
    "lecturerName": "Demo Lecturer",
    "lecturerId": 2,
    "totalGroups": 2,
    "submittedCount": 2,
    "reviewedCount": 2
  },
  "timestamp": "2026-06-23T15:52:51.7581695"
}
Error Responses:

Status	Code	Message
404	NOT_FOUND	Assignment not found
403	FORBIDDEN	You do not have permission to grade this assignment
401	UNAUTHORIZED	Authentication is required
2. Save Grade Draft
Save a grade as draft (not published yet). Students cannot view draft grades.

Endpoint: POST /grades/draft

Request Headers:

text
Authorization: Bearer {{accessToken}}
Content-Type: application/json
Request Body:

json
{
  "assignmentId": 1,
  "groupId": 1,
  "score": 85.5,
  "comment": "Good work! Some areas need improvement, but overall solid effort."
}
Field	Type	Required	Description
assignmentId	Long	Yes	ID of the assignment
groupId	Long	Yes	ID of the group
score	BigDecimal	Yes	Score (0-100)
comment	String	No	Lecturer's comment (max 2000 characters)
Response (200 OK):

json
{
  "success": true,
  "message": "Success",
  "data": {
    "assignmentId": 1,
    "assignmentTitle": "Test Assignment",
    "groupId": 1,
    "groupName": "Group A",
    "score": 85.5,
    "comment": "Good work!",
    "savedAt": "2026-06-23T16:07:34.8806648",
    "isPublished": false,
    "message": "Grades have been saved as draft. Students cannot view them until they are published."
  },
  "timestamp": "2026-06-23T16:07:35.0203821"
}
Error Responses:

Status	Code	Message
400	INVALID_SCORE	Invalid grade format. Please enter a valid grade within the allowed grading scale (0-100).
400	COMMENT_TOO_LONG	Final comment exceeds the maximum allowed length (2000 characters).
404	NOT_FOUND	Group not found
403	FORBIDDEN	You do not have permission to grade this assignment
3. Publish Grades
Publish final grades for selected groups. Students can view published grades via UC-10.

Endpoint: POST /grades/publish

Request Headers:

text
Authorization: Bearer {{accessToken}}
Content-Type: application/json
Request Body:

json
{
  "assignmentId": 1,
  "groupIds": [1],
  "grades": [
    {
      "groupId": 1,
      "score": 85.5,
      "comment": "Excellent work! Clear structure and thorough analysis."
    }
  ]
}
Field	Type	Required	Description
assignmentId	Long	Yes	ID of the assignment
groupIds	List<Long>	Yes	List of group IDs to publish
grades	List<GradeEntry>	Yes	Grade entries for each group
GradeEntry:

Field	Type	Required	Description
groupId	Long	Yes	ID of the group
score	BigDecimal	Yes	Score (0-100)
comment	String	No	Lecturer's comment (max 2000 characters)
Response (200 OK):

json
{
  "success": true,
  "message": "Success",
  "data": {
    "assignmentId": 1,
    "assignmentTitle": "Test Assignment",
    "publishedGroups": [
      {
        "groupId": 1,
        "groupName": "Group A",
        "score": 85.5,
        "comment": "Excellent work!",
        "success": true,
        "warning": null,
        "error": null
      }
    ],
    "publishedAt": "2026-06-23T16:14:39.5478484",
    "publishedBy": "Demo Lecturer",
    "totalPublished": 1,
    "totalWithWarning": 0
  },
  "timestamp": "2026-06-23T16:14:39.5973163"
}
Response with Warning (200 OK - No Peer Review):

json
{
  "success": true,
  "data": {
    "publishedGroups": [
      {
        "groupId": 4,
        "groupName": "Group D",
        "score": 80,
        "comment": "Good effort!",
        "success": true,
        "warning": "[Group D] has not received any peer review. Do you still want to publish the grade?",
        "error": null
      }
    ],
    "totalPublished": 1,
    "totalWithWarning": 1
  }
}
Error Responses:

Status	Code	Message
400	VALIDATION_ERROR	Score must not exceed 100 (DTO validation)
400	INVALID_SCORE	Invalid grade format. Please enter a valid grade within the allowed grading scale (0-100).
400	COMMENT_TOO_LONG	Final comment exceeds the maximum allowed length (2000 characters).
400	NO_GROUP_SELECTED	Please select at least one group to publish grades for.
400	NO_SUBMISSION	Cannot publish grade for [Group Name] because the group has not submitted the assignment.
404	NOT_FOUND	Group not found
403	FORBIDDEN	You do not have permission to grade this assignment
4. Unpublish Grade
Unpublish a previously published grade. Students can no longer view it.

Endpoint: POST /grades/unpublish

Request Headers:

text
Authorization: Bearer {{accessToken}}
Content-Type: application/json
Request Body:

json
{
  "assignmentId": 1,
  "groupId": 1
}
Field	Type	Required	Description
assignmentId	Long	Yes	ID of the assignment
groupId	Long	Yes	ID of the group
Response (200 OK):

json
{
  "success": true,
  "message": "Success",
  "data": {
    "assignmentId": 1,
    "assignmentTitle": "Test Assignment",
    "groupId": 1,
    "groupName": "Group A",
    "score": 85.50,
    "comment": "Excellent work!",
    "savedAt": "2026-06-23T16:15:37.4574291",
    "isPublished": false,
    "message": "Grade has been unpublished. Students can no longer view it.",
    "unpublishedAt": "2026-06-23 16:15:37",
    "unpublishedBy": "Demo Lecturer"
  },
  "timestamp": "2026-06-23T16:15:37.5038498"
}
Error Responses:

Status	Code	Message
404	NOT_FOUND	Grade result not found
400	BAD_REQUEST	Grade is already unpublished
403	FORBIDDEN	You do not have permission to grade this assignment
5. Toggle Showcase Mode
Enable or disable Public Showcase Mode for an assignment. When enabled, all students can view other groups' submissions and anonymous peer feedback.

Endpoint: POST /grades/showcase

Request Headers:

text
Authorization: Bearer {{accessToken}}
Content-Type: application/json
Request Body:

json
{
  "assignmentId": 1,
  "enabled": true
}
Field	Type	Required	Description
assignmentId	Long	Yes	ID of the assignment
enabled	Boolean	Yes	true = enable, false = disable
Response (200 OK):

json
{
  "success": true,
  "message": "Success",
  "data": {
    "assignmentId": 1,
    "assignmentTitle": "Test Assignment",
    "enabled": true,
    "message": "Showcase status updated",
    "updatedAt": "2026-06-23 16:20:07",
    "updatedBy": "Demo Lecturer",
    "updatedById": 2
  },
  "timestamp": "2026-06-23T16:20:07.4599395"
}
Error Responses:

Status	Code	Message
400	BAD_REQUEST	Could not change Showcase Mode due to a system error. Please try again.
403	FORBIDDEN	You do not have permission to grade this assignment
6. Exception Flows
Exception 2.1: Invalid Score (>100 or <0)
Request: Score = 105
Response: 400 Bad Request

json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed.",
  "fieldErrors": [
    {
      "field": "grades[0].score",
      "message": "Score must not exceed 100"
    }
  ]
}
Exception 2.2: Comment Too Long (>2000 characters)
Request: Comment > 2000 characters
Response: 400 Bad Request

json
{
  "success": false,
  "code": "COMMENT_TOO_LONG",
  "message": "Final comment exceeds the maximum allowed length (2000 characters). Please shorten your comment."
}
Exception 2.3: No Group Selected
Request: groupIds: []
Response: 400 Bad Request

json
{
  "success": false,
  "code": "NO_GROUP_SELECTED",
  "message": "Please select at least one group to publish grades for."
}
Exception 3.1: No Submission
Request: Group has no submission
Response: 400 Bad Request

json
{
  "success": false,
  "code": "NO_SUBMISSION",
  "message": "Cannot publish grade for [Group C] because the group has not submitted the assignment."
}
Exception 3.2: No Peer Review (Warning Only)
Request: Group has submission but no peer review
Response: 200 OK with Warning

json
{
  "success": true,
  "data": {
    "publishedGroups": [
      {
        "groupId": 4,
        "groupName": "Group D",
        "score": 80,
        "comment": "Good effort!",
        "success": true,
        "warning": "[Group D] has not received any peer review. Do you still want to publish the grade?",
        "error": null
      }
    ]
  }
}
Exception 4.1: Could not change Showcase Mode
Response: 400 Bad Request

json
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "Could not change Showcase Mode due to a system error. Please try again."
}
7. Postman Collection
You can import the Postman collection using this JSON:

json
// Paste the full Postman collection JSON here
// See separate file: postman/UC-09_Grades_API.json
Environment Variables:

Variable	Value
baseUrl	http://localhost:8080/api
accessToken	(auto-filled after login)
assignmentId	1
groupId1	1
groupId2	2
groupId3	3
groupId4	4
Architecture
text
Controller → Service → DAO → Database
Layer	Package	Responsibility
Presentation	controller, dto	HTTP request/response, DTO validation
Business Logic	service, service/impl	Business rules, orchestration
Data Access	dao	Database queries
Persistence	entity	JPA entities, Flyway migrations
Files Created/Modified
File	Type
PublishGradeRequest.java	DTO
SaveDraftGradeRequest.java	DTO
UnpublishGradeRequest.java	DTO
ToggleShowcaseRequest.java	DTO
GradingDataResponse.java	DTO
GradingEvidenceResponse.java	DTO
PeerReviewEvidenceResponse.java	DTO
PublishGradeResponse.java	DTO
GradeDraftResponse.java	DTO
ShowcaseStatusResponse.java	DTO
GradeValidationException.java	Exception
NoSubmissionException.java	Exception
GradeMapper.java	Mapper
GradeService.java	Service Interface
GradeServiceImpl.java	Service Implementation
GradeController.java	Controller
AssignmentDao.java	DAO (extended)
AssignmentResultDao.java	DAO (extended)
AssignmentSubmissionDao.java	DAO (extended)
PeerReviewAssignmentDao.java	DAO (extended)
StudentGroupDao.java	DAO (extended)
GlobalExceptionHandler.java	Exception Handler (extended)
