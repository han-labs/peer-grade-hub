// frontend/src/pages/student/StudentCourseDetailPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Eye,
  CalendarClock,
  Clock
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getStudentLessons, getStudentAssignments } from '../../api/studentApi';
import { ApiError } from '../../api/httpClient';
import DashboardTopbar from '../../components/DashboardTopbar';
import LoadingScreen from '../../components/LoadingScreen';

function formatDate(value) {
  if (!value) return 'No deadline set';
  return new Date(value).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function StudentCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();
  
  // Lấy courseName từ state (truyền từ trang trước)
  const stateCourseName = location.state?.courseName;
  const [courseName, setCourseName] = useState(stateCourseName || '');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLessons, setExpandedLessons] = useState({});

  useEffect(() => {
    let mounted = true;

    const fetchLessonsWithAssignments = async () => {
      try {
        setLoading(true);
        
        // 1. Lấy danh sách lessons
        const lessonsResponse = await getStudentLessons(courseId, token);
        const lessonsData = lessonsResponse.data || [];
        
        // 2. Lấy assignments cho từng lesson
        const lessonsWithAssignments = await Promise.all(
          lessonsData.map(async (lesson) => {
            try {
              const assignmentResponse = await getStudentAssignments(lesson.id, token);
              return {
                ...lesson,
                assignments: assignmentResponse.data?.assignments || []
              };
            } catch {
              return { ...lesson, assignments: [] };
            }
          })
        );
        
        if (mounted) {
          setLessons(lessonsWithAssignments);
          
          // Nếu chưa có courseName từ state, lấy từ API
          if (!stateCourseName) {
            setCourseName(lessonsWithAssignments.length > 0 
              ? lessonsWithAssignments[0].courseName || `Course ${courseId}` 
              : `Course ${courseId}`);
          }
          
          // Mở rộng tất cả lessons mặc định
          const initialExpand = {};
          lessonsWithAssignments.forEach(lesson => {
            initialExpand[lesson.id] = true;
          });
          setExpandedLessons(initialExpand);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load lessons');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLessonsWithAssignments();

    return () => {
      mounted = false;
    };
  }, [courseId, token, logout, navigate, stateCourseName]);

  const toggleLesson = (lessonId) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

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
            <p>Browse lessons and assignments for this course.</p>
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
          <div className="lesson-detail-list">
            {lessons.map((lesson, index) => {
              const isExpanded = expandedLessons[lesson.id] !== false;
              const assignments = lesson.assignments || [];

              return (
                <div className="lesson-detail-item" key={lesson.id}>
                  {/* Lesson Header */}
                  <div 
                    className="lesson-detail-header"
                    onClick={() => toggleLesson(lesson.id)}
                  >
                    <div className="lesson-detail-header__left">
                      <span className="lesson-detail__number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="lesson-detail__title">{lesson.title}</h3>
                        <span className="lesson-detail__count">
                          {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="lesson-detail__toggle"
                      type="button"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  </div>

                  {/* Assignments List */}
                  {isExpanded && (
                    <div className="lesson-detail-assignments">
                      {assignments.length === 0 ? (
                        <p className="lesson-detail__empty">No assignments in this lesson.</p>
                      ) : (
                        assignments.map((assignment) => (
                          <div className="assignment-detail-card" key={assignment.id}>
                            <div className="assignment-detail-card__info">
                              <div className="assignment-detail-card__icon">
                                <FileText size={18} />
                              </div>
                              <div>
                                <div className="assignment-detail-card__title-row">
                                  <h4 className="assignment-detail-card__title">
                                    {assignment.title}
                                  </h4>
                                  
                                </div>
                                {assignment.description && (
                                  <p className="assignment-detail-card__description">
                                    {assignment.description}
                                  </p>
                                )}
                                <div className="assignment-detail-card__meta">
                                  <span>
                                    <CalendarClock size={13} />
                                    Submission: {formatDate(assignment.submissionDeadline)}
                                  </span>
                                  <span>
                                    <Clock size={13} />
                                    Review: {formatDate(assignment.reviewDeadline)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="assignment-detail-card__actions">
                              <button
                                className="assignment-detail-card__btn assignment-detail-card__btn--submit"
                                type="button"
                                onClick={() => navigate(`/student/assignments/${assignment.id}/submission`)}
                              >
                                <FileText size={16} />
                                Submit Assignment
                              </button>
                              <button
                                className="assignment-detail-card__btn"
                                type="button"
                                onClick={() => navigate(`/student/assignments/${assignment.id}/results`, {
                                  state: { 
                                    courseId: parseInt(courseId)
                                    
                                  }
                                })}
                              >
                                <Eye size={16} />
                                View Results
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}