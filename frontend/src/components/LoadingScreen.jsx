import BrandMark from './BrandMark.jsx'

function LoadingScreen({ label }) {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <BrandMark />
      <span className="loading-spinner" aria-hidden="true" />
      <p>{label}</p>
    </main>
  )
}

export default LoadingScreen
