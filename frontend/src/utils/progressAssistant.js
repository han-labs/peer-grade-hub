const FALLBACK_MESSAGE = 'I could not find enough progress data on this screen yet. Please refresh the page or open a specific progress view.'

const SUGGESTIONS = {
  overview: ['Summary', 'Most Issues', 'Due Soon', 'Submissions', 'Reviews', 'On Track'],
  course: ['Summary', 'Open First', 'Due Soon', 'Missing', 'Review Issues', 'On Track'],
  assignment: ['Summary', 'Check First', 'Not Submitted', 'Late', 'No Reviews', 'Incomplete', 'On Track'],
}

const INTENT_KEYWORDS = [
  ['NO_RECEIVED_REVIEW', ['no received review', 'without review', 'no review', 'chua nhan review', 'khong co review']],
  ['LATE_SUBMISSIONS', ['submitted late', 'late', 'nop tre', 'tre']],
  ['DUE_SOON', ['deadline', 'due', 'soon', 'sap den han', 'han']],
  ['MOST_ISSUES', ['most issues', 'check first', 'open first', 'priority', 'attention', 'rui ro', 'can chu y', 'uu tien']],
  ['MISSING_SUBMISSIONS', ['not submitted', 'submission', 'submitted', 'missing', 'chua nop', 'chua submit', 'thieu bai']],
  ['INCOMPLETE_REVIEWS', ['pending review', 'incomplete', 'review', 'reviews', 'chua review', 'chua hoan tat']],
  ['ON_TRACK', ['on track', 'okay', 'fine', 'ontrack', 'on-track', 'on track', 'on course', 'on schedule', 'on time', 'on target', 'on pace', 'on plan', 'on progress', 'on status', 'on health', 'on safe', 'on clear', 'on ok', 'ok', 'ổn', 'on dinh', 'dung tien do']],
  ['SUMMARY', ['summary', 'summarize', 'overview', 'tong quan', 'tom tat']],
]

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function buildSuggestedQuestions(contextType) {
  return SUGGESTIONS[contextType] ?? SUGGESTIONS.assignment
}

export function detectIntent(question) {
  const normalized = normalizeText(question)
  const matchedIntent = INTENT_KEYWORDS.find(([, keywords]) => (
    keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  ))

  return matchedIntent?.[0] ?? 'SUMMARY'
}

function numberValue(value) {
  return Number(value ?? 0)
}

function plural(count, singular, pluralText = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralText}`
}

function compactList(items, limit = 3) {
  const visibleItems = items.filter(Boolean).slice(0, limit)
  if (visibleItems.length === 0) return ''
  const remaining = items.length - visibleItems.length
  return remaining > 0 ? `${visibleItems.join(', ')} and ${remaining} more` : visibleItems.join(', ')
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getAssignmentStats(assignment) {
  return assignment?.progress?.statistics ?? assignment?.statistics ?? null
}

function getAssignmentIssueScore(assignment) {
  const statistics = getAssignmentStats(assignment)
  if (!statistics) return 0

  return numberValue(statistics.pendingCount)
    + numberValue(statistics.lateCount)
    + numberValue(statistics.incompleteReviews)
    + numberValue(statistics.groupsWithNoReceivedReview)
}

function hasProgressData(assignment) {
  return Boolean(getAssignmentStats(assignment))
}

function getCourseIssueScore(course) {
  return (course?.assignments ?? []).reduce((total, assignment) => total + getAssignmentIssueScore(assignment), 0)
}

function getCourseAssignments(course) {
  return course?.assignments ?? []
}

function getUpcomingItemsFromAssignments(assignments, extra = {}) {
  const now = Date.now()

  return assignments
    .flatMap((assignment) => [
      {
        ...extra,
        assignmentTitle: assignment.title,
        kind: 'Submission',
        value: assignment.submissionDeadline,
      },
      {
        ...extra,
        assignmentTitle: assignment.title,
        kind: 'Review',
        value: assignment.reviewDeadline,
      },
    ])
    .filter((item) => item.value)
    .map((item) => ({ ...item, time: new Date(item.value).getTime() }))
    .filter((item) => !Number.isNaN(item.time) && item.time >= now)
    .sort((first, second) => first.time - second.time)
}

function aggregateAssignmentStatistics(assignments) {
  return assignments.reduce((totals, assignment) => {
    const statistics = getAssignmentStats(assignment)
    if (!statistics) return totals

    const late = numberValue(statistics.lateCount)
    totals.progressItems += 1
    totals.totalGroups += numberValue(statistics.totalGroups)
    totals.submitted += numberValue(statistics.submittedCount)
    totals.notSubmitted += numberValue(statistics.pendingCount)
    totals.late += late
    totals.completedReviews += numberValue(statistics.completedReviews)
    totals.incompleteReviews += numberValue(statistics.incompleteReviews)
    totals.noReceivedReview += numberValue(statistics.groupsWithNoReceivedReview)
    totals.reviewTasks += numberValue(statistics.totalReviewAssignments)
    return totals
  }, {
    completedReviews: 0,
    incompleteReviews: 0,
    late: 0,
    noReceivedReview: 0,
    notSubmitted: 0,
    progressItems: 0,
    reviewTasks: 0,
    submitted: 0,
    totalGroups: 0,
  })
}

function getGroupName(group) {
  return group?.groupName ?? group?.name ?? `Group ${group?.groupId ?? ''}`.trim()
}

function isMissingSubmission(group) {
  return !group?.submissionStatus || ['DRAFT', 'RETURNED'].includes(group.submissionStatus)
}

function isLateSubmission(group) {
  return Boolean(group?.late) || group?.submissionStatus === 'LATE'
}

function isReviewed(group) {
  return numberValue(group?.assignedReviewCount) > 0 && numberValue(group?.incompleteReviewCount) === 0
}

function getGroupIssues(group) {
  const issues = []
  if (isMissingSubmission(group)) issues.push('missing submission')
  if (isLateSubmission(group)) issues.push('late submission')
  if (numberValue(group?.incompleteReviewCount) > 0) issues.push('incomplete reviews')
  if (!group?.hasReceivedReview) issues.push('no received review')
  return issues
}

function getCourseName(course) {
  return course?.courseName ?? course?.name ?? 'this course'
}

function getOverviewData(data) {
  const courses = data?.courses ?? []
  const assignments = courses.flatMap((course) => (
    getCourseAssignments(course).map((assignment) => ({ ...assignment, courseName: getCourseName(course) }))
  ))
  const totals = aggregateAssignmentStatistics(assignments)
  const upcoming = courses.flatMap((course) => getUpcomingItemsFromAssignments(
    getCourseAssignments(course),
    { courseName: getCourseName(course) },
  ))

  return { assignments, courses, totals, upcoming }
}

function getCourseData(data) {
  const assignments = data?.assignments ?? []
  const course = data?.courseWorkspace?.course ?? data?.course ?? {}
  const totals = aggregateAssignmentStatistics(assignments)
  const upcoming = getUpcomingItemsFromAssignments(assignments)

  return { assignments, course, totals, upcoming }
}

function getAssignmentData(data) {
  const dashboard = data?.dashboard ?? {}
  const groups = dashboard.groups ?? data?.groups ?? []
  const statistics = dashboard.statistics ?? {}
  return { dashboard, groups, statistics }
}

function answerOverview(intent, data) {
  const { assignments, courses, totals, upcoming } = getOverviewData(data)
  if (courses.length === 0) return FALLBACK_MESSAGE

  if (intent === 'DUE_SOON') {
    const nextItems = upcoming.slice(0, 3).map((item) => (
      `${item.courseName} / ${item.assignmentTitle}: ${item.kind} due ${formatDate(item.value)}`
    ))
    return nextItems.length > 0
      ? `Closest items: ${nextItems.join('; ')}.`
      : 'No upcoming due dates are visible on this screen.'
  }

  if (intent === 'MOST_ISSUES') {
    const [course] = [...courses]
      .map((course) => ({ course, issueScore: getCourseIssueScore(course) }))
      .sort((first, second) => second.issueScore - first.issueScore)

    if (!course || course.issueScore === 0) return 'No course is showing attention items right now.'
    return `${getCourseName(course.course)} should be checked first with ${plural(course.issueScore, 'issue')}.`
  }

  if (intent === 'MISSING_SUBMISSIONS') {
    return `Across visible assignments: ${plural(totals.submitted, 'submission')} recorded, ${plural(totals.notSubmitted, 'missing submission')}, and ${plural(totals.late, 'late submission')}.`
  }

  if (intent === 'LATE_SUBMISSIONS') {
    return totals.late > 0
      ? `${plural(totals.late, 'late submission')} appear across the visible courses.`
      : 'No late submissions are visible across these courses.'
  }

  if (intent === 'INCOMPLETE_REVIEWS' || intent === 'NO_RECEIVED_REVIEW') {
    return `Peer review status: ${plural(totals.completedReviews, 'completed review')}, ${plural(totals.incompleteReviews, 'incomplete review')}, and ${plural(totals.noReceivedReview, 'group')} with no received review.`
  }

  if (intent === 'ON_TRACK') {
    const onTrackCourses = courses
      .filter((course) => getCourseIssueScore(course) === 0 && getCourseAssignments(course).some(hasProgressData))
      .map(getCourseName)

    return onTrackCourses.length > 0
      ? `On track: ${compactList(onTrackCourses)}.`
      : 'No course with progress data is fully on track yet.'
  }

  const attentionAssignments = assignments.filter((assignment) => getAssignmentIssueScore(assignment) > 0).length
  return `${plural(courses.length, 'course')} are visible with ${plural(assignments.length, 'assignment')}. ${plural(attentionAssignments, 'assignment')} need attention. Submissions: ${totals.submitted} submitted, ${totals.notSubmitted} missing, ${totals.late} late.`
}

function answerCourse(intent, data) {
  const { assignments, course, totals, upcoming } = getCourseData(data)
  if (!course?.id && assignments.length === 0) return FALLBACK_MESSAGE

  if (intent === 'DUE_SOON') {
    const [nextItem] = upcoming
    return nextItem
      ? `Next due: ${nextItem.assignmentTitle} has ${nextItem.kind.toLowerCase()} due ${formatDate(nextItem.value)}.`
      : 'No upcoming due date is visible for this course.'
  }

  if (intent === 'MOST_ISSUES') {
    const [assignment] = [...assignments]
      .map((item) => ({ assignment: item, issueScore: getAssignmentIssueScore(item) }))
      .sort((first, second) => second.issueScore - first.issueScore)

    if (!assignment || assignment.issueScore === 0) return 'No assignment is showing attention items right now.'
    return `Open ${assignment.assignment.title} first. It has ${plural(assignment.issueScore, 'attention item')}.`
  }

  if (intent === 'MISSING_SUBMISSIONS') {
    const missingAssignments = assignments
      .filter((assignment) => numberValue(getAssignmentStats(assignment)?.pendingCount) > 0)
      .map((assignment) => `${assignment.title} (${getAssignmentStats(assignment).pendingCount})`)

    return missingAssignments.length > 0
      ? `Missing submissions: ${compactList(missingAssignments)}.`
      : 'No missing submissions are visible for these assignments.'
  }

  if (intent === 'LATE_SUBMISSIONS') {
    const lateAssignments = assignments
      .filter((assignment) => numberValue(getAssignmentStats(assignment)?.lateCount) > 0)
      .map((assignment) => `${assignment.title} (${getAssignmentStats(assignment).lateCount})`)

    return lateAssignments.length > 0
      ? `Late submissions: ${compactList(lateAssignments)}.`
      : 'No late submissions are visible for this course.'
  }

  if (intent === 'INCOMPLETE_REVIEWS' || intent === 'NO_RECEIVED_REVIEW') {
    const reviewIssueAssignments = assignments
      .filter((assignment) => {
        const statistics = getAssignmentStats(assignment)
        return numberValue(statistics?.incompleteReviews) > 0
          || numberValue(statistics?.groupsWithNoReceivedReview) > 0
      })
      .map((assignment) => assignment.title)

    return reviewIssueAssignments.length > 0
      ? `Review issues appear in ${compactList(reviewIssueAssignments)}.`
      : 'No review issues are visible for this course.'
  }

  if (intent === 'ON_TRACK') {
    const onTrackAssignments = assignments
      .filter((assignment) => hasProgressData(assignment) && getAssignmentIssueScore(assignment) === 0)
      .map((assignment) => assignment.title)

    return onTrackAssignments.length > 0
      ? `On track: ${compactList(onTrackAssignments)}.`
      : 'No assignment with progress data is fully on track yet.'
  }

  const attentionAssignments = assignments.filter((assignment) => getAssignmentIssueScore(assignment) > 0).length
  return `${getCourseName(course)} has ${plural(assignments.length, 'assignment')}. ${plural(attentionAssignments, 'assignment')} need attention. Submissions: ${totals.submitted} submitted, ${totals.notSubmitted} missing, ${totals.late} late.`
}

function answerAssignment(intent, data) {
  const { dashboard, groups, statistics } = getAssignmentData(data)
  if (!dashboard?.assignment && groups.length === 0) return FALLBACK_MESSAGE

  if (intent === 'MOST_ISSUES') {
    const issueGroups = groups
      .map((group) => ({ group, issues: getGroupIssues(group) }))
      .filter((item) => item.issues.length > 0)
      .sort((first, second) => second.issues.length - first.issues.length)

    return issueGroups.length > 0
      ? `Check first: ${compactList(issueGroups.map((item) => `${getGroupName(item.group)} (${item.issues.join(', ')})`), 2)}.`
      : 'All visible groups look on track right now.'
  }

  if (intent === 'MISSING_SUBMISSIONS') {
    const missingGroups = groups.filter(isMissingSubmission).map(getGroupName)
    return missingGroups.length > 0
      ? `Not submitted: ${compactList(missingGroups)}.`
      : 'No missing submissions are visible for this assignment.'
  }

  if (intent === 'LATE_SUBMISSIONS') {
    const lateGroups = groups.filter(isLateSubmission).map(getGroupName)
    return lateGroups.length > 0
      ? `Submitted late: ${compactList(lateGroups)}.`
      : 'No late submissions are visible for this assignment.'
  }

  if (intent === 'INCOMPLETE_REVIEWS') {
    const incompleteGroups = groups
      .filter((group) => numberValue(group.incompleteReviewCount) > 0)
      .map((group) => `${getGroupName(group)} (${group.incompleteReviewCount})`)

    return incompleteGroups.length > 0
      ? `Incomplete reviews: ${compactList(incompleteGroups)}.`
      : 'No incomplete review tasks are visible for this assignment.'
  }

  if (intent === 'NO_RECEIVED_REVIEW') {
    const groupsWithoutReview = groups.filter((group) => !group.hasReceivedReview).map(getGroupName)
    return groupsWithoutReview.length > 0
      ? `No received review: ${compactList(groupsWithoutReview)}.`
      : 'Every visible group has received review evidence or an incoming review.'
  }

  if (intent === 'ON_TRACK') {
    const onTrackGroups = groups
      .filter((group) => getGroupIssues(group).length === 0 && isReviewed(group))
      .map(getGroupName)

    return onTrackGroups.length > 0
      ? `On track: ${compactList(onTrackGroups)}.`
      : 'No group is fully on track yet.'
  }

  return `${dashboard.assignment?.title ?? 'This assignment'} has ${plural(numberValue(statistics.totalGroups), 'group')}. ${numberValue(statistics.submittedCount)} submitted, ${numberValue(statistics.pendingCount)} not submitted, ${numberValue(statistics.lateCount)} late. Reviews: ${numberValue(statistics.completedReviews)} completed and ${numberValue(statistics.incompleteReviews)} incomplete.`
}

export function generateAssistantAnswer({ contextType, data, question }) {
  const intent = detectIntent(question)

  if (contextType === 'overview') return answerOverview(intent, data)
  if (contextType === 'course') return answerCourse(intent, data)
  if (contextType === 'assignment') return answerAssignment(intent, data)

  return FALLBACK_MESSAGE
}
