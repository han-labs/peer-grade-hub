// frontend/src/pages/result/ViewResultsPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  RefreshCw,
  ShieldAlert,
  UsersRound,
  Star,
  MessageSquare,
  Clock,
  User,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getPublishedResults } from '../../api/resultApi';
import { ApiError } from '../../api/httpClient';
import DashboardTopbar from '../../components/DashboardTopbar';
import LoadingScreen from '../../components/LoadingScreen';
import PersonalResultCard from '../../components/result/PersonalResultCard';
import ClassGallery from '../../components/result/ClassGallery';
import '../../styles/result.css'; 

/**
 * Access Restricted - Student only
 */
function AccessRestricted() {
  const navigate = useNavigate();

  return (
    <main className="restricted-state">
      <span className="restricted-state__icon">
        <ShieldAlert size={28} aria-hidden="true" />
      </span>
      <p className="eyebrow">Student workspace</p>
      <h1>Access restricted</h1>
      <p>Results can only be viewed by students.</p>
      <button className="secondary-action" type="button" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to dashboard
      </button>
    </main>
  );
}

/**
 * Not Published State
 */
function NotPublishedState({ message, assignmentTitle }) {
  return (
    <div className="result-not-published">
      <div className="result-not-published__icon">
        <Clock size={32} />
      </div>
      <h2>Results are being processed</h2>
      <p>{message || 'Your results are still being processed.'}</p>
      <p className="result-not-published__hint">
        The lecturer will publish results for this assignment soon.
      </p>
    </div>
  );
}

/**
 * Error State
 */
function ErrorState({ message, onRetry }) {
  return (
    <div className="result-error-state">
      <AlertCircle size={32} className="result-error-state__icon" />
      <h2>Unable to load results</h2>
      <p>{message}</p>
      <button className="secondary-action" type="button" onClick={onRetry}>
        <RefreshCw size={17} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

/**
 * Loading State
 */
function LoadingState() {
  return (
    <div className="result-loading-state">
      <span className="loading-spinner" aria-hidden="true" />
      <h2>Loading your results</h2>
      <p>Please wait while we fetch your published results.</p>
    </div>
  );
}

/**
 * UC-10 View Published Results Page
 */
export default function ViewResultsPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  const fetchResults = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await getPublishedResults(assignmentId, token);
      setData(response.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to load results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, token, logout, navigate]);

  useEffect(() => {
    if (!isStudent) return;

    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) fetchResults();
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchResults, isStudent]);

  const handleRetry = () => {
    fetchResults();
  };

  // ===== ACCESS CONTROL =====
  if (!isStudent) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Eye} label="View Results" />
        <AccessRestricted />
      </div>
    );
  }

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Eye} label="View Results" />
        <main className="result-page">
          <LoadingState />
        </main>
      </div>
    );
  }

  // ===== ERROR =====
  if (error) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Eye} label="View Results" />
        <main className="result-page">
          <ErrorState message={error} onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  // ===== NOT PUBLISHED (Alternate Flow 2.1) =====
  if (data && data.isPublished === false) {
    return (
      <div className="dashboard-shell">
        <DashboardTopbar icon={Eye} label="View Results" />
        <main className="result-page">
          <button className="back-link" type="button" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={17} aria-hidden="true" />
            Dashboard
          </button>
          <NotPublishedState 
            message={data.message} 
            assignmentTitle={data.assignmentTitle} 
          />
        </main>
      </div>
    );
  }

  // ===== PUBLISHED (Main Flow) =====
  const { personalResult, showcaseMode, showcaseGallery } = data || {};
  const hasGallery = showcaseMode && showcaseGallery?.enabled !== false;

  return (
    <div className="dashboard-shell">
      <DashboardTopbar icon={Eye} label="View Results" />

      <main className="result-page">
        {/* Back Button */}
        <button className="back-link" type="button" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={17} aria-hidden="true" />
          Dashboard
        </button>

        {/* Page Header */}
        <section className="result-page__header">
          <div>
            <p className="eyebrow">Published Results</p>
            <h1>Assignment Results</h1>
            <p className="result-page__subtitle">
              View your final grade, lecturer feedback, and peer evaluations.
            </p>
          </div>
          <div className="result-page__badges">
            <span className="status-badge">
              <CheckCircle2 size={14} />
              Published
            </span>
            {showcaseMode && (
              <span className="result-badge result-badge--showcase">
                <UsersRound size={14} />
                Showcase ON
              </span>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="result-tabs" role="tablist">
          <button
            className={`result-tab ${activeTab === 'personal' ? 'result-tab--active' : ''}`}
            onClick={() => setActiveTab('personal')}
            role="tab"
            aria-selected={activeTab === 'personal'}
            aria-controls="tab-personal"
          >
            <User size={16} />
            Personal Results
          </button>
          {hasGallery && (
            <button
              className={`result-tab ${activeTab === 'gallery' ? 'result-tab--active' : ''}`}
              onClick={() => setActiveTab('gallery')}
              role="tab"
              aria-selected={activeTab === 'gallery'}
              aria-controls="tab-gallery"
            >
              <UsersRound size={16} />
              Class Gallery
            </button>
          )}
        </div>

        {/* Tab Panels */}
        <div className="result-tab-panels">
          {/* Personal Results Tab */}
          <div
            id="tab-personal"
            className={`result-tab-panel ${activeTab === 'personal' ? 'result-tab-panel--active' : ''}`}
            role="tabpanel"
            hidden={activeTab !== 'personal'}
          >
            {personalResult ? (
              <PersonalResultCard result={personalResult} />
            ) : (
              <div className="result-empty">
                <AlertCircle size={24} />
                <p>No personal results available.</p>
              </div>
            )}
          </div>

          {/* Class Gallery Tab */}
          {hasGallery && (
            <div
              id="tab-gallery"
              className={`result-tab-panel ${activeTab === 'gallery' ? 'result-tab-panel--active' : ''}`}
              role="tabpanel"
              hidden={activeTab !== 'gallery'}
            >
              <ClassGallery 
                gallery={showcaseGallery} 
                currentGroupId={personalResult?.groupId}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}