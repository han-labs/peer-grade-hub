// frontend/src/pages/student/StudentAssignmentsPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Eye, CalendarClock, Clock } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getStudentAssignments } from '../../api/studentApi';
import { ApiError } from '../../api/httpClient';
import DashboardTopbar from '../../components/DashboardTopbar';
import LoadingScreen from '../../components/LoadingScreen';

export default function StudentAssignmentsPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadingTimer = window.setTimeout(() => {
      if (mounted) setLoading(true);
    }, 0);

    getStudentAssignments(lessonId, token)
      .then((response) => {
        if (mounted) {
        const data = response.data || {};
        setData(data);
        setAssignments(data.assignments || []);
                    }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load assignments');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimer);
    };
  }, [lessonId, token, logout, navigate]);

  if (loading) return <LoadingScreen label="Loading assignments..." />;

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={ClipboardList} label="Assignments" />
        <main className="lesson-assignments-page">
          <button className="back-link" type="button" onClick={() => navigate(`/student/courses/${courseId}/lessons`)}>
            <ArrowLeft size={17} />
            Back to lessons
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
      <DashboardTopbar icon={ClipboardList} label="Assignments" />

      <main className="lesson-assignments-page">
        <button className="back-link" type="button" onClick={() => navigate(`/student/courses/${courseId}/lessons`)}>
          <ArrowLeft size={17} />
          Back to lessons
        </button>

        <div className="lesson-assignments-page__header">
          <div className="lesson-assignments-page__breadcrumb">
            <span>{data?.courseName || 'Course'}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{data?.lessonTitle || 'Lesson'}</span>
          </div>
          <div className="lesson-assignments-page__title-section">
            <h1>Assignments</h1>
            <p className="lesson-assignments-page__subtitle">
              Select an assignment to view your results.
            </p>
          </div>
          <div className="lesson-assignments-page__stats">
            <span className="stat-chip">
              <ClipboardList size={16} />
              {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={40} />
            <h3>No assignments found</h3>
            <p>This lesson does not have any assignments yet.</p>
          </div>
        ) : (
          <div className="assignment-grid">
            {assignments.map((assignment) => (
              <div className="assignment-card" key={assignment.id}>
                <div className="assignment-card__header">
                  <div className="assignment-card__icon">
                    <ClipboardList size={20} />
                  </div>
                  
                </div>
                <div className="assignment-card__body">
                  <h3 className="assignment-card__title">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="assignment-card__description">{assignment.description}</p>
                  )}
                  <div className="assignment-card__meta">
                    <div className="assignment-card__meta-item">
                      <CalendarClock size={15} />
                      <span>
                        Submission: {assignment.submissionDeadline
                          ? new Date(assignment.submissionDeadline).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>
                    <div className="assignment-card__meta-item">
                      <Clock size={15} />
                      <span>
                        Review: {assignment.reviewDeadline
                          ? new Date(assignment.reviewDeadline).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="assignment-card__action">
                  <button
                    className="assignment-card__btn"
                    type="button"
                    onClick={() => navigate(`/student/assignments/${assignment.id}/results`)}
                  >
                    <Eye size={16} />
                    View Results
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
