import { BookOpenCheck } from 'lucide-react'

function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}>
      <span className="brand-mark__icon" aria-hidden="true">
        <BookOpenCheck size={compact ? 20 : 24} strokeWidth={2} />
      </span>
      <span className="brand-mark__name">PeerGrade Hub</span>
    </div>
  )
}

export default BrandMark
