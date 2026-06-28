// frontend/src/components/grade/ShowcaseToggle.jsx
import { Eye, EyeOff } from 'lucide-react'

export default function ShowcaseToggle({ enabled, onToggle, isLoading }) {
  const handleToggle = () => {
    if (!isLoading) {
      onToggle(!enabled)
    }
  }

  return (
    <div className="showcase-toggle">
      <div className="showcase-toggle__info">
        <div className="showcase-toggle__label">
          {enabled ? <Eye size={18} /> : <EyeOff size={18} />}
          <span>Public Showcase Mode</span>
        </div>
        <p className="showcase-toggle__description">
          {enabled 
            ? 'All students can view other groups\' submissions and anonymous feedback.' 
            : 'Students can only view their own group\'s results.'}
        </p>
      </div>

      <button
        className={`showcase-toggle__btn ${enabled ? 'showcase-toggle__btn--active' : ''}`}
        onClick={handleToggle}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? 'Updating...' : enabled ? 'Turn OFF' : 'Turn ON'}
      </button>

      <span className={`showcase-toggle__status ${enabled ? 'showcase-toggle__status--active' : ''}`}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  )
}
