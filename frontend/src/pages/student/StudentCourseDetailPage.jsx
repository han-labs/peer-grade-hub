// frontend/src/pages/student/StudentCourseDetailPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getStudentLessons } from '../../api/studentApi';
import { ApiError } from '../../api/httpClient';
import DashboardTopbar from '../../components/DashboardTopbar';
import LoadingScreen from '../../components/LoadingScreen';

export default function StudentCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [courseName, setCourseName] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadingTimer = window.setTimeout(() => {
      if (mounted) setLoading(true);
    }, 0);

    getStudentLessons(courseId, token)
      .then((response) => {
        if (mounted) {
        const lessonsData = response.data || [];
        setLessons(lessonsData);
        // Course name có thể lấy từ param hoặc từ item đầu tiên
        setCourseName(lessonsData.length > 0 ? lessonsData[0].courseName : 'Course');
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load lessons');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimer);
    };
  }, [courseId, token, logout, navigate]);

  if (loading) return <LoadingScreen label="Loading lessons..." />;

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={BookOpen} label="Course Lessons" />
        <main className="lessons-page">
          <button className="back-link" type="button" onClick={() => navigate('/student/courses')}>
            <ArrowLeft size={17} />
            Back to courses
          </button>
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
      <DashboardTopbar icon={BookOpen} label="Course Lessons" />

      <main className="lessons-page">
        <button className="back-link" type="button" onClick={() => navigate('/student/courses')}>
          <ArrowLeft size={17} />
          Back to courses
        </button>

        <div className="lessons-page__header">
          <div>
            <p className="eyebrow">Course</p>
            <h1>{courseName}</h1>
            <p>Select a lesson to view its assignments and results.</p>
          </div>
          <div className="lessons-page__stats">
            <span className="stat-chip">
              <BookOpen size={16} />
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={32} />
            <h3>No lessons found</h3>
            <p>This course does not have any lessons yet.</p>
          </div>
        ) : (
          <div className="lesson-list">
            {lessons.map((lesson, index) => (
              <div
                className="lesson-item"
                key={lesson.id}
                onClick={() => navigate(`/student/courses/${courseId}/lessons/${lesson.id}/assignments`)}
              >
                <div className="lesson-item__number">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="lesson-item__content">
                  <div className="lesson-item__info">
                    <h3 className="lesson-item__title">{lesson.title}</h3>
                  </div>
                  <button className="lesson-item__action" type="button">
                    View Assignments <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
