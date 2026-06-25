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
import MonitorProgressPage from './pages/MonitorProgressPage.jsx'
import GradingPage from './pages/grade/GradingPage.jsx'
import LecturerCoursesPage from './pages/LecturerCoursesPage.jsx'
import CourseLessonsPage from './pages/CourseLessonsPage.jsx'
import LessonAssignmentsPage from './pages/LessonAssignmentsPage.jsx'
import PeerReviewPage from './pages/PeerReviewPage.jsx'

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

      {['/dashboard', '/student', '/lecturer', '/admin'].map((path) => (
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

      {/* UC-08: Monitor Progress */}
      <Route
        path="/lecturer/courses/:courseId/assignments/:assignmentId/progress"
        element={
          <ProtectedRoute>
            <MonitorProgressPage />
          </ProtectedRoute>
        }
      />

      {/* UC-07: Submit Peer Review */}
      <Route
        path="/peer-reviews/tasks/:id"
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