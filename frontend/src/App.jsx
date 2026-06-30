import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { useAuth } from './auth/useAuth.js'
import LoadingScreen from './components/LoadingScreen.jsx'
import AssignPeerReviewPage from './pages/AssignPeerReviewPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ManageCoursesPage from './pages/ManageCoursesPage.jsx'
import CourseWorkspacePage from './pages/CourseWorkspacePage.jsx'
import GroupManagementPage from './pages/GroupManagementPage.jsx'
import CourseProgressDashboardPage from './pages/CourseProgressDashboardPage.jsx'
import MonitorProgressPage from './pages/MonitorProgressPage.jsx'
import ProgressLandingPage from './pages/ProgressLandingPage.jsx'
import GradingPage from './pages/grade/GradingPage.jsx'
import LecturerCoursesPage from './pages/LecturerCoursesPage.jsx'
import LecturerGroupsPage from './pages/LecturerGroupsPage.jsx'
import CourseLessonsPage from './pages/CourseLessonsPage.jsx'
import LessonAssignmentsPage from './pages/LessonAssignmentsPage.jsx'
import PeerReviewPage from './pages/PeerReviewPage.jsx'
import ViewResultsPage from './pages/result/ViewResultsPage.jsx';
import StudentCoursesPage from './pages/student/StudentCoursesPage.jsx';
import StudentCourseDetailPage from './pages/student/StudentCourseDetailPage.jsx';
import StudentAssignmentsPage from './pages/student/StudentAssignmentsPage.jsx';
import InvitationJoinPage from './pages/student/InvitationJoinPage.jsx'
import GroupSelectionPage from './pages/student/GroupSelectionPage.jsx'
import AssignmentSubmissionPage from './pages/student/AssignmentSubmissionPage.jsx'
import StudentSubmissionDetailPage from './pages/student/StudentSubmissionDetailPage.jsx'
import PeerReviewTasksPage from './pages/PeerReviewTasksPage.jsx'

function PublicOnlyRoute({ children }) {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return <LoadingScreen label="Restoring your session" />
  }

  return user ? <Navigate to="/dashboard" replace /> : children
}

function RouteFallback() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return <LoadingScreen label="Loading PeerGrade Hub" />
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {['/dashboard', '/student', '/student/dashboard', '/lecturer', '/lecturer/dashboard', '/admin', '/admin/dashboard'].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      ))}

      {/* UC-02: Manage Courses */}
      <Route
        path="/lecturer/courses"
        element={
          <ProtectedRoute>
            <ManageCoursesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/courses/:courseId/workspace"
        element={
          <ProtectedRoute>
            <CourseWorkspacePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/courses/:courseId/groups"
        element={
          <ProtectedRoute>
            <GroupManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/manage-groups"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerGroupsPage />
          </ProtectedRoute>
        }
      />

      {/* UC-14: Assign Peer Review */}
      <Route
        path="/lecturer/assignments/:assignmentId/peer-review-assignments"
        element={
          <ProtectedRoute>
            <AssignPeerReviewPage />
          </ProtectedRoute>
        }
      />

      {/* UC-09: Manage Final Grades */}
      <Route
        path="/lecturer/assignments/:assignmentId/grading"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <GradingPage />
          </ProtectedRoute>
        }
      />

      {/* UC-09: Lecturer Courses (Navigation) */}
      <Route
        path="/lecturer/my-courses"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerCoursesPage />
          </ProtectedRoute>
        }
      />

      {/* UC-09: Course Lessons */}
      <Route
        path="/lecturer/courses/:courseId/lessons"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <CourseLessonsPage />
          </ProtectedRoute>
        }
      />

      {/* UC-09: Lesson Assignments */}
      <Route
        path="/lecturer/courses/:courseId/lessons/:lessonId/assignments"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LessonAssignmentsPage />
          </ProtectedRoute>
        }
      />
      {/* UC-10: Student Navigation */}
      <Route
        path="/join"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <InvitationJoinPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/join/:invitationCode"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <InvitationJoinPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/groups"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <GroupSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentCoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/lessons"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentCourseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/lessons/:lessonId/assignments"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentAssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments/:assignmentId/submission"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AssignmentSubmissionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/assignments/:assignmentId/submissions/:submissionId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentSubmissionDetailPage />
          </ProtectedRoute>
        }
      />
      {/* UC-10: View Results */}
      <Route
        path="/student/assignments/:assignmentId/results"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ViewResultsPage />
          </ProtectedRoute>
        }
      />

      
      {/* UC-08: Monitor Progress */}
      <Route
        path="/lecturer/progress"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <ProgressLandingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/progress/courses/:courseId"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <CourseProgressDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer/courses/:courseId/assignments/:assignmentId/progress"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <MonitorProgressPage />
          </ProtectedRoute>
        }
      />

      {/* UC-07: Submit Peer Review */}
      <Route
        path="/peer-review-tasks"
        element={
          <ProtectedRoute>
            <PeerReviewTasksPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/peer-review-tasks/:id"
        element={
          <ProtectedRoute>
            <PeerReviewPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<RouteFallback />} />
    </Routes>
  )
}

export default App
