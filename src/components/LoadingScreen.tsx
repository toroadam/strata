import { useEffect, useRef, useState } from 'react'
import logoSvg from '../assets/Toro-Logo2.svg'

interface Props {
  duration?: number
  onComplete?: () => void
}

const phases = [
  'Attaching databases',
  'Enabling services',
  'Verifying tilemap',
  'Validating layers',
]

const BAR_WIDTH = 304

const LoadingScreen: React.FC<Props> = ({ duration = 2500, onComplete }) => {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)
  const startRef = useRef<number>(0)

  useEffect(() => {
    let raf = 0
    startRef.current = performance.now()

    // Drive the progress bar steadily from 0 -> 1 over the load duration.
    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const t = Math.min(elapsed / duration, 1)
      setProgress(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Cycle the status text in step with the bar.
    const phaseTimer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length)
    }, Math.max(360, duration / phases.length))

    // Fade out once loaded, then hand off.
    const fadeTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onComplete?.(), 350)
    }, duration)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(phaseTimer)
      clearTimeout(fadeTimer)
    }
  }, [duration, onComplete])

  return (
    <div className="loading-screen" style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#080d12', opacity: visible ? 1 : 0,
      transition: 'opacity 350ms ease', pointerEvents: visible ? 'auto' as const : 'none' as const,
    }}>
      <style>{`
        @keyframes loadSlideIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', position: 'absolute', inset: 0 }}>
        {/* Logo + wordmark */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '40px',
          animation: visible ? 'loadSlideIn 700ms cubic-bezier(.2,.8,.3,1) forwards' : 'none',
        }}>
          <img src={logoSvg} alt="Toro" style={{ width: '83px', height: 'auto', display: 'block' }} />
          <span style={{
            fontSize: '34px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em',
            fontFamily: '"Golos UI", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', lineHeight: 1,
          }}>
            Strata
          </span>
        </div>

        {/* Progress + text */}
        <div className="loading-progress" style={{
          width: `${BAR_WIDTH}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          animation: visible ? 'loadSlideIn 700ms cubic-bezier(.2,.8,.3,1) 150ms both' : 'none',
        }}>
          {/* Progress bar */}
          <div style={{
            width: `${BAR_WIDTH}px`, height: '5px', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '9999px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(progress * BAR_WIDTH, BAR_WIDTH)}px`, height: '5px',
              background: 'linear-gradient(90deg, #B3122C 0%, #E11837 60%, #FF3B57 100%)',
              borderRadius: '9999px', transition: 'width 90ms linear',
              boxShadow: '0 0 12px rgba(225,24,55,0.65)',
            }} />
          </div>

          {/* Status text */}
          <span className="loading-status" style={{
            fontSize: '14px', fontWeight: 700, color: '#ffffff',
            fontFamily: '"Golos UI", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            letterSpacing: '0', lineHeight: '20px', whiteSpace: 'nowrap',
          }}>
            {phases[phaseIndex]}
          </span>
        </div>
      </div>

      <style>{`
        .loading-progress span::after {
          content: '';
          display: inline-block;
          margin-left: 6px;
          animation: loadDots 1.2s infinite;
        }
        @keyframes loadDots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen
