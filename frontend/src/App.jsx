import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { useAuth } from './auth/useAuth.js'
import LoadingScreen from './components/LoadingScreen.jsx'
import AssignPeerReviewPage from './pages/AssignPeerReviewPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MonitorProgressPage from './pages/MonitorProgressPage.jsx'
import GradingPage from './pages/grade/GradingPage' 
import LecturerCoursesPage from './pages/LecturerCoursesPage'
import CourseLessonsPage from './pages/CourseLessonsPage'
import LessonAssignmentsPage from './pages/LessonAssignmentsPage'
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

      <Route
        path="/lecturer/assignments/:assignmentId/peer-review-assignments"
        element={
          <ProtectedRoute>
            <AssignPeerReviewPage />
          </ProtectedRoute>
        }
      />
      
      <Route path="/lecturer/assignments/:assignmentId/grading" element={
            <ProtectedRoute allowedRoles={['LECTURER']}>
              <GradingPage />
            </ProtectedRoute>
          } />

        <Route
        path="/lecturer/courses"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerCoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
          path="/lecturer/courses/:courseId/lessons"
          element={
              <ProtectedRoute allowedRoles={['LECTURER']}>
                  <CourseLessonsPage />
              </ProtectedRoute>
          }
      />
      <Route
      path="/lecturer/courses/:courseId/lessons/:lessonId/assignments"
      element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
              <LessonAssignmentsPage />
          </ProtectedRoute>
      }
  />
      
      <Route
        path="/lecturer/courses/:courseId/assignments/:assignmentId/progress"
        element={
          <ProtectedRoute>
            <MonitorProgressPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<RouteFallback />} />
    </Routes>
  )
}

export default App
