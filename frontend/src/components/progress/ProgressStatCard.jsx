function ProgressStatCard({ icon: Icon, label, value, hint, tone = 'neutral' }) {
  return (
    <article className={`monitor-stat-card monitor-stat-card--${tone}`}>
      <span className="monitor-stat-card__icon">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  )
}

export default ProgressStatCard
