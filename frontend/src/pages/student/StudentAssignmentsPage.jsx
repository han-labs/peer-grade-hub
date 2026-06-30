// frontend/src/pages/student/StudentAssignmentsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Eye, CalendarClock, Clock, FileText, UsersRound } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getStudentAssignments } from '../../api/studentApi';
import { getSubmittableAssignments } from '../../api/studentSubmissionApi.js';
import { ApiError } from '../../api/httpClient';
import DashboardTopbar from '../../components/DashboardTopbar';
import LoadingScreen from '../../components/LoadingScreen';

function formatDateTime(value) {
  if (!value) return 'No deadline set';
  return new Date(value).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deadlineLabel(assignment) {
  if (assignment.deadlinePassed) return 'Closed';
  if (assignment.warningRed) return 'Due soon';
  return 'Open';
}

function sortedByDeadline(assignments) {
  return [...assignments].sort((first, second) => {
    const firstTime = first.submissionDeadline ? new Date(first.submissionDeadline).getTime() : Number.POSITIVE_INFINITY;
    const secondTime = second.submissionDeadline ? new Date(second.submissionDeadline).getTime() : Number.POSITIVE_INFINITY;
    return firstTime - secondTime || (first.assignmentId ?? 0) - (second.assignmentId ?? 0);
  });
}

function isSubmitted(assignment) {
  return assignment.submissionId !== null && assignment.submissionId !== undefined;
}

function sortedSubmittedAssignments(assignments) {
  return [...assignments].sort((first, second) => {
    const firstSubmittedAt = first.submittedAt ? new Date(first.submittedAt).getTime() : null;
    const secondSubmittedAt = second.submittedAt ? new Date(second.submittedAt).getTime() : null;

    if (firstSubmittedAt !== null && secondSubmittedAt !== null) {
      return secondSubmittedAt - firstSubmittedAt || (first.assignmentId ?? 0) - (second.assignmentId ?? 0);
    }
    if (firstSubmittedAt !== null) return -1;
    if (secondSubmittedAt !== null) return 1;

    const firstDeadline = first.submissionDeadline ? new Date(first.submissionDeadline).getTime() : Number.POSITIVE_INFINITY;
    const secondDeadline = second.submissionDeadline ? new Date(second.submissionDeadline).getTime() : Number.POSITIVE_INFINITY;
    return firstDeadline - secondDeadline || (first.assignmentId ?? 0) - (second.assignmentId ?? 0);
  });
}

function submissionDetailUrl(assignment) {
  if (assignment.studentSubmissionUrl) return assignment.studentSubmissionUrl;
  if (assignment.submissionId && assignment.courseId && assignment.assignmentId) {
    return `/student/courses/${assignment.courseId}/assignments/${assignment.assignmentId}/submissions/${assignment.submissionId}`;
  }
  return null;
}

export default function StudentAssignmentsPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('not-submitted');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const notSubmittedAssignments = useMemo(
    () => sortedByDeadline(assignments.filter((assignment) => !isSubmitted(assignment))),
    [assignments],
  );
  const submittedAssignments = useMemo(
    () => sortedSubmittedAssignments(assignments.filter(isSubmitted)),
    [assignments],
  );
  const visibleAssignments = activeTab === 'submitted' ? submittedAssignments : notSubmittedAssignments;

  useEffect(() => {
    let mounted = true;
    const loadingTimer = window.setTimeout(() => {
      if (mounted) setLoading(true);
    }, 0);

    const request = lessonId
      ? getStudentAssignments(lessonId, token)
      : getSubmittableAssignments(token);

    request
      .then((response) => {
        if (mounted) {
          if (lessonId) {
            const data = response.data || {};
            setData(data);
            setAssignments(data.assignments || []);
          } else {
            setData(null);
            setAssignments(sortedByDeadline(response.data || []));
          }
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || (lessonId ? 'Failed to load assignments' : 'Failed to load submittable assignments'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimer);
    };
  }, [lessonId, token, logout, navigate]);

  if (loading) return <LoadingScreen label={lessonId ? 'Loading assignments...' : 'Loading submit assignment workspace...'} />;

  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={lessonId ? ClipboardList : FileText} label={lessonId ? 'Assignments' : 'Submit Assignment'} />
        <main className="lesson-assignments-page">
          <button className="back-link" type="button" onClick={() => navigate(lessonId ? `/student/courses/${courseId}/lessons` : '/student')}>
            <ArrowLeft size={17} />
            {lessonId ? 'Back to lessons' : 'Back to overview'}
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

  if (!lessonId) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={FileText} label="Submit Assignment" />

        <main className="lesson-assignments-page">
          <div className="lesson-assignments-page__header">
            <div className="lesson-assignments-page__breadcrumb">
              <span>Student workspace</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Submit Assignment</span>
            </div>
            <div className="lesson-assignments-page__title-section">
              <h1>Submit Assignment</h1>
              <p className="lesson-assignments-page__subtitle">
                View upcoming assignment deadlines across your active courses.
              </p>
            </div>
            <div className="lesson-assignments-page__stats">
              <span className="stat-chip">
                <ClipboardList size={16} />
                {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
              </span>
            </div>
          </div>

          <div className="assignment-subtabs" role="tablist" aria-label="Assignment submission status">
            <button
              aria-selected={activeTab === 'not-submitted'}
              className={`assignment-subtab ${activeTab === 'not-submitted' ? 'assignment-subtab--active' : ''}`}
              onClick={() => setActiveTab('not-submitted')}
              role="tab"
              type="button"
            >
              Not Submitted ({notSubmittedAssignments.length})
            </button>
            <button
              aria-selected={activeTab === 'submitted'}
              className={`assignment-subtab ${activeTab === 'submitted' ? 'assignment-subtab--active' : ''}`}
              onClick={() => setActiveTab('submitted')}
              role="tab"
              type="button"
            >
              Submitted ({submittedAssignments.length})
            </button>
          </div>

          {visibleAssignments.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={40} />
              <h3>{activeTab === 'submitted' ? 'No submitted assignments' : 'No pending assignments'}</h3>
              <p>
                {activeTab === 'submitted'
                  ? 'You have not submitted any assignments yet.'
                  : 'You have no pending assignments.'}
              </p>
            </div>
          ) : (
            <div className="assignment-grid">
              {visibleAssignments.map((assignment) => {
                const submitted = isSubmitted(assignment);
                const closed = Boolean(assignment.deadlinePassed);
                const primaryLabel = closed
                  ? 'Closed'
                  : submitted
                    ? 'Update Submission'
                    : 'Submit Assignment';
                const deadlineStatus = deadlineLabel(assignment);

                return (
                  <div className="assignment-card" key={assignment.assignmentId}>
                    <div className="assignment-card__header">
                      <div className="assignment-card__icon">
                        <ClipboardList size={20} />
                      </div>
                      <div className="assignment-card__badge">
                        <span className={`status-badge ${closed ? 'status-badge--archived' : 'status-badge--active'}`}>
                          {deadlineStatus}
                        </span>
                        <span className={`status-badge ${submitted ? 'status-badge--active' : 'status-badge--archived'}`}>
                          {submitted ? 'Submitted' : 'Not submitted'}
                        </span>
                      </div>
                    </div>
                    <div className="assignment-card__body">
                      <h3 className="assignment-card__title">{assignment.assignmentTitle}</h3>
                      {assignment.description && (
                        <p className="assignment-card__description">{assignment.description}</p>
                      )}
                      <div className="assignment-card__meta">
                        <div className="assignment-card__meta-item">
                          <FileText size={15} />
                          <span>{assignment.courseName || 'Course'}</span>
                        </div>
                        {assignment.lessonTitle && (
                          <div className="assignment-card__meta-item">
                            <ClipboardList size={15} />
                            <span>{assignment.lessonTitle}</span>
                          </div>
                        )}
                        {assignment.groupName && (
                          <div className="assignment-card__meta-item">
                            <UsersRound size={15} />
                            <span>{assignment.groupName}</span>
                          </div>
                        )}
                        <div className="assignment-card__meta-item">
                          <CalendarClock size={15} />
                          <span>Submission: {formatDateTime(assignment.submissionDeadline)}</span>
                        </div>
                        {submitted && assignment.submittedAt && (
                          <div className="assignment-card__meta-item">
                            <Clock size={15} />
                            <span>Submitted: {formatDateTime(assignment.submittedAt)}</span>
                          </div>
                        )}
                        {submitted && assignment.submissionStatus && (
                          <div className="assignment-card__meta-item">
                            <FileText size={15} />
                            <span>Status: {assignment.submissionStatus}</span>
                          </div>
                        )}
                        {!closed && (
                          <div className="assignment-card__meta-item">
                            <Clock size={15} />
                            <span>{assignment.hoursRemaining ?? 0} hours remaining</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="assignment-card__action">
                      <button
                        className="assignment-card__btn"
                        disabled={closed || (submitted && closed)}
                        type="button"
                        onClick={() => navigate(`/student/assignments/${assignment.assignmentId}/submission`)}
                      >
                        <FileText size={16} />
                        {primaryLabel}
                      </button>
                      {submitted && submissionDetailUrl(assignment) && (
                        <button
                          className="assignment-card__btn assignment-card__btn--secondary"
                          type="button"
                          onClick={() => navigate(submissionDetailUrl(assignment))}
                        >
                          <Eye size={16} />
                          View Submission
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              Select an assignment to submit work or view your results.
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
                    onClick={() => navigate(`/student/assignments/${assignment.id}/submission`)}
                  >
                    <FileText size={16} />
                    Submit Assignment
                  </button>
                  <button
                    className="assignment-card__btn assignment-card__btn--secondary"
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
