// frontend/src/components/grade/GradingStats.jsx
import { UsersRound, CheckCircle2, ClipboardCheck } from 'lucide-react'

/**
 * Statistics cards for grading page
 * Displays: Total Groups, Submitted, Reviewed
 */
export default function GradingStats({ stats }) {
  const { totalGroups, submittedCount, reviewedCount } = stats

  const statItems = [
    {
      label: 'Total groups',
      value: totalGroups,
      hint: 'All course groups',
      icon: UsersRound,
      accent: 'lecturer',
    },
    {
      label: 'Submitted',
      value: submittedCount,
      hint: 'Groups with submission',
      icon: CheckCircle2,
      accent: 'student',
    },
    {
      label: 'Reviewed',
      value: reviewedCount,
      hint: 'Groups with peer review',
      icon: ClipboardCheck,
      accent: 'administrator',
    },
  ]

  return (
    <section className="stats-grid grading-stats" aria-label="Grading summary">
      {statItems.map(({ label, value, hint, icon: Icon, accent }) => (
        <article className="stat-card" key={label}>
          <span className={`stat-card__icon stat-card__icon--${accent}`}>
            <Icon size={21} />
          </span>
          <p>{label}</p>
          <strong>{value}</strong>
          <small>{hint}</small>
        </article>
      ))}
    </section>
  )
}