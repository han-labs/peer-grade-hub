import { getLecturerCourses, getCourseWorkspace } from './courseApi.js'
import { getCourseGroups } from './groupApi.js'
import { getLessonAssignments } from './lessonApi.js'

function unwrapApiResponse(response) {
  return response?.data ?? response
}

function normalizeCourse(course) {
  return {
    ...course,
    id: course.id,
    courseName: course.courseName ?? course.name ?? 'Untitled course',
    classCode: course.classCode ?? course.code ?? 'No class code',
    courseStatus: course.courseStatus ?? course.status ?? 'ACTIVE',
  }
}

function normalizeAssignment(assignment, lesson) {
  return {
    ...assignment,
    id: assignment.id,
    title: assignment.title ?? 'Untitled assignment',
    description: assignment.description ?? '',
    lessonId: lesson.lessonId,
    lessonTitle: lesson.lessonTitle,
    submissionDeadline: assignment.submissionDeadline,
    reviewDeadline: assignment.reviewDeadline,
  }
}

async function loadLessonAssignments(lesson, token) {
  const assignmentResponse = await getLessonAssignments(lesson.id, token)
  const assignmentData = unwrapApiResponse(assignmentResponse)

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    assignments: (assignmentData.assignments || []).map((assignment) => normalizeAssignment(assignment, {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
    })),
  }
}

export async function getCourseProgressWorkspace(courseId, token) {
  const [workspaceResponse, groupResponse] = await Promise.all([
    getCourseWorkspace(courseId, token),
    getCourseGroups(courseId, token),
  ])
  const workspace = unwrapApiResponse(workspaceResponse)
  const groupData = unwrapApiResponse(groupResponse)
  const course = normalizeCourse(workspace.course ?? { id: Number(courseId) })
  const lessons = await Promise.all(
    (workspace.lessons || []).map((lesson) => loadLessonAssignments(lesson, token)),
  )
  const assignments = lessons.flatMap((lesson) => lesson.assignments)
  const groups = groupData.groups ?? []

  return {
    course,
    lessons,
    assignments,
    groups,
    groupCount: groups.length,
  }
}

export async function getLecturerProgressWorkspace(token) {
  const courseList = await getLecturerCourses(token)

  return Promise.all(
    (courseList || []).map(async (course) => {
      try {
        const workspace = await getCourseProgressWorkspace(course.id, token)
        return {
          ...normalizeCourse(course),
          ...workspace.course,
          lessons: workspace.lessons,
          assignments: workspace.assignments,
          groups: workspace.groups,
          groupCount: workspace.groupCount,
        }
      } catch (error) {
        return {
          ...normalizeCourse(course),
          lessons: [],
          assignments: [],
          groups: [],
          groupCount: 0,
          error: error.message || 'Assignments could not be loaded for this course.',
        }
      }
    }),
  )
}
