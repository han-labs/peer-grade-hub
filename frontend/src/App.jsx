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
        path="/lecturer/assignments/:assignmentId/peer-review-assignments"
        element={
          <ProtectedRoute>
            <AssignPeerReviewPage />
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

