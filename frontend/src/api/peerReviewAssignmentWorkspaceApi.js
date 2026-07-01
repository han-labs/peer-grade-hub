import { getCourseWorkspace, getLecturerCourses } from './courseApi.js'
import { getCourseGroups } from './groupApi.js'
import { getLessonAssignments } from './lessonApi.js'
import { getPeerReviewAssignmentPageData } from './peerReviewAssignmentApi.js'

function unwrapApiResponse(response) {
  return response?.data ?? response
}

function normalizeCourse(course) {
  return {
    ...course,
    id: course.id,
    courseName: course.courseName ?? course.name ?? 'Untitled course',
    classCode: course.classCode ?? 'No class code',
    courseStatus: course.courseStatus ?? course.status ?? 'ACTIVE',
    description: course.description ?? '',
  }
}

function normalizeLesson(lesson) {
  return {
    id: lesson.id ?? lesson.lessonId,
    title: lesson.title ?? lesson.lessonTitle ?? 'Untitled lesson',
  }
}

function normalizeAssignment(assignment, lesson) {
  return {
    ...assignment,
    id: assignment.id,
    title: assignment.title ?? 'Untitled assignment',
    description: assignment.description ?? '',
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    submissionDeadline: assignment.submissionDeadline,
    reviewDeadline: assignment.reviewDeadline,
  }
}

async function loadAssignmentsForLesson(lesson, token) {
  const response = await getLessonAssignments(lesson.id, token)
  const data = unwrapApiResponse(response)

  return {
    ...lesson,
    assignments: (data?.assignments ?? []).map((assignment) => normalizeAssignment(assignment, lesson)),
  }
}

async function loadPeerReviewReadiness(assignment, token) {
  try {
    const pageData = await getPeerReviewAssignmentPageData(assignment.id, token)
    const groupCount = pageData.groups?.length ?? 0
    const existingPeerReviewAssignmentCount = pageData.peerReviewAssignments?.length ?? 0
    const groupsWithoutReceivedReviewCount = pageData.groupsWithoutReceivedReviews?.length ?? 0

    return {
      ...assignment,
      courseId: pageData.assignment?.courseId ?? assignment.courseId,
      courseName: pageData.assignment?.courseName,
      classCode: pageData.assignment?.classCode,
      reviewDeadlineOpen: pageData.assignment?.reviewDeadlineOpen ?? false,
      groupCount,
      existingPeerReviewAssignmentCount,
      groupsWithoutReceivedReviewCount,
      readyForAssignment: groupCount >= 2,
    }
  } catch (error) {
    return {
      ...assignment,
      groupCount: 0,
      existingPeerReviewAssignmentCount: 0,
      groupsWithoutReceivedReviewCount: 0,
      reviewDeadlineOpen: false,
      readyForAssignment: false,
      readinessError: error.message || 'Review assignment readiness could not be loaded.',
    }
  }
}

export async function getAssignPeerReviewCourseWorkspace(courseId, token) {
  const [workspaceResponse, groupResponse] = await Promise.all([
    getCourseWorkspace(courseId, token),
    getCourseGroups(courseId, token),
  ])
  const workspace = unwrapApiResponse(workspaceResponse)
  const course = normalizeCourse(workspace.course ?? { id: Number(courseId) })
  const rawLessons = workspace.lessons ?? []
  const lessons = await Promise.all(
    rawLessons.map((lesson) => loadAssignmentsForLesson(normalizeLesson(lesson), token)),
  )
  const assignments = lessons.flatMap((lesson) => lesson.assignments)
  const assignmentsWithReadiness = await Promise.all(
    assignments.map((assignment) => loadPeerReviewReadiness(assignment, token)),
  )
  const groups = groupResponse?.groups ?? []

  return {
    course,
    lessons,
    assignments: assignmentsWithReadiness,
    groupCount: groups.length,
  }
}

export async function getAssignPeerReviewWorkspace(token) {
  const courses = await getLecturerCourses(token)

  return Promise.all(
    (courses ?? []).map(async (course) => {
      try {
        const workspace = await getAssignPeerReviewCourseWorkspace(course.id, token)
        const openReviewAssignmentCount = workspace.assignments.filter(
          (assignment) => assignment.reviewDeadlineOpen,
        ).length
        const needsAssignmentActionCount = workspace.assignments.filter(
          (assignment) => assignment.groupsWithoutReceivedReviewCount > 0,
        ).length
        const groupsWithoutReviewersCount = workspace.assignments.reduce(
          (total, assignment) => total + assignment.groupsWithoutReceivedReviewCount,
          0,
        )
        const existingPeerReviewAssignmentCount = workspace.assignments.reduce(
          (total, assignment) => total + assignment.existingPeerReviewAssignmentCount,
          0,
        )

        return {
          ...normalizeCourse(course),
          ...workspace.course,
          groupCount: workspace.groupCount,
          assignmentCount: workspace.assignments.length,
          openReviewAssignmentCount,
          needsAssignmentActionCount,
          groupsWithoutReviewersCount,
          existingPeerReviewAssignmentCount,
          assignments: workspace.assignments,
        }
      } catch (error) {
        return {
          ...normalizeCourse(course),
          groupCount: 0,
          assignmentCount: 0,
          openReviewAssignmentCount: 0,
          needsAssignmentActionCount: 0,
          groupsWithoutReviewersCount: 0,
          existingPeerReviewAssignmentCount: 0,
          assignments: [],
          error: error.message || 'Peer review setup could not be loaded for this course.',
        }
      }
    }),
  )
}
