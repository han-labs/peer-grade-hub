// frontend/src/pages/student/StudentCoursesPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, UsersRound } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getStudentCourses } from '../../api/studentApi';
import { ApiError } from '../../api/httpClient';
import DashboardTopbar from '../../components/DashboardTopbar';
import LoadingScreen from '../../components/LoadingScreen';

export default function StudentCoursesPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadingTimer = window.setTimeout(() => {
      if (mounted) setLoading(true);
    }, 0);
    getStudentCourses(token)
      .then((response) => {
        if (mounted) setCourses(response.data || []);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load courses');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimer);
    };
  }, [token, logout, navigate]);

  if (loading) return <LoadingScreen label="Loading your courses..." />;

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="My Courses" />
        <main className="courses-page">
          <div className="error-state">
            <p>{error}</p>
            <button className="secondary-action" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={BookOpen} label="My Courses" />

      <main className="courses-page courses-page--student">
        <div className="courses-page__header">
          <p className="eyebrow">Student workspace</p>
          <h1>My Active Courses</h1>
          <p>Select a course to view lessons and assignments.</p>
        </div>

        <section className="course-invitation-card course-invitation-card--link" aria-labelledby="course-invitation-title">
          <div>
            <p className="eyebrow">Join a course</p>
            <h2 id="course-invitation-title">Need to join another course?</h2>
            <p>Use the dedicated join page to enter an invitation code from your lecturer.</p>
          </div>
          <button className="compact-primary-action" type="button" onClick={() => navigate('/join')}>
            Join a new course
            <ArrowRight size={16} />
          </button>
        </section>

        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={32} />
            <h3>No active courses</h3>
            <p>You haven't joined any active courses yet.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-text)' }}>
              Use an invitation code from your lecturer to join a course.
            </p>
          </div>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <div className="course-card" key={course.id}>
                <div className="course-card__header">
                  <div className="course-card__badge">
                    <span className="status-badge status-badge--active">
                      {course.courseStatus || 'ACTIVE'}
                    </span>
                  </div>
                </div>
                <div className="course-card__body">
                  <h3 className="course-card__title">{course.courseName}</h3>
                  <div className="course-card__meta">
                    <span>
                      <span className="meta-label">Class Code</span>
                      <strong>{course.classCode}</strong>
                    </span>
                    <span>
                      <span className="meta-label">Semester</span>
                      <strong>{course.semester}</strong>
                    </span>
                  </div>
                  {course.description && (
                    <p className="course-card__description">{course.description}</p>
                  )}
                </div>
                <button
                  className="course-card__action"
                  onClick={() => navigate(`/student/courses/${course.id}/lessons`)}
                >
                  View Lessons <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
