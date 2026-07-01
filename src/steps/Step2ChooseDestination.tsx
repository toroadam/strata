import React, { useEffect, useMemo, useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useWizardStore } from '../store/wizardStore'
import { useDestinationStore, type MapboxDestination } from '../store/destinationStore'
import { fetchMapStyles } from '../services/mapbox'
import { MAPBOX_TOKEN } from '../mapbox/mapboxConfig'
import { colors } from '../styles/tokens'
import { Icons, EnvBadge } from '../components/ui'

// Standard Mapbox basemaps offered as publish targets when no account-specific
// styles are available (or as a supplement to them).
const STANDARD_TARGETS: Omit<MapboxDestination, 'fromAccount'>[] = [
  { styleId: 'mapbox/satellite-streets-v12', styleName: 'Toro Satellite HD', styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12', owner: 'mapbox' },
  { styleId: 'mapbox/satellite-v9', styleName: 'Satellite (imagery only)', styleUrl: 'mapbox://styles/mapbox/satellite-v9', owner: 'mapbox' },
  { styleId: 'mapbox/outdoors-v12', styleName: 'Outdoors', styleUrl: 'mapbox://styles/mapbox/outdoors-v12', owner: 'mapbox' },
  { styleId: 'mapbox/streets-v12', styleName: 'Streets', styleUrl: 'mapbox://styles/mapbox/streets-v12', owner: 'mapbox' },
  { styleId: 'mapbox/light-v11', styleName: 'Light', styleUrl: 'mapbox://styles/mapbox/light-v11', owner: 'mapbox' },
  { styleId: 'mapbox/dark-v11', styleName: 'Dark', styleUrl: 'mapbox://styles/mapbox/dark-v11', owner: 'mapbox' },
]

const styleThumb = (styleUrl: string, lng: number, lat: number) => {
  const path = styleUrl.replace('mapbox://styles/', '')
  return `https://api.mapbox.com/styles/v1/${path}/static/${lng},${lat},12.5,0/280x170@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`
}

const Step2ChooseDestination: React.FC = () => {
  const { selectedCourse } = useCourseStore()
  const currentStep = useWizardStore((s) => s.currentStep)
  const completeStep = useWizardStore((s) => s.completeStep)
  const setCurrentStepIsValid = useWizardStore((s) => s.setCurrentStepIsValid)
  const { destination, setDestination } = useDestinationStore()

  const [accountStyles, setAccountStyles] = useState<MapboxDestination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const lng = selectedCourse?.location.longitude ?? -98.5
  const lat = selectedCourse?.location.latitude ?? 39.8

  const loadStyles = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!MAPBOX_TOKEN) throw new Error('No Mapbox token configured.')
      const styles = await fetchMapStyles(MAPBOX_TOKEN)
      const mapped: MapboxDestination[] = styles
        .filter((s) => s.url)
        .map((s) => ({
          styleId: s.owner && s.id ? `${s.owner}/${s.id}` : s.id,
          styleName: s.name || s.id,
          styleUrl: s.url as string,
          owner: s.owner,
          fromAccount: true,
        }))
      setAccountStyles(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the Mapbox styles API.')
      setAccountStyles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStyles()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const standardTargets: MapboxDestination[] = useMemo(
    () => STANDARD_TARGETS.map((t) => ({ ...t, fromAccount: false })),
    []
  )

  // Auto-select a sensible default (the primary satellite target) once loading
  // settles, so the user is never blocked — but they can change it.
  useEffect(() => {
    if (loading) return
    if (destination) return
    const preferred = accountStyles[0] || standardTargets[0]
    if (preferred) handleSelect(preferred)
  }, [loading, accountStyles]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (target: MapboxDestination) => {
    setDestination(target)
    setCurrentStepIsValid(true)
    completeStep(currentStep)
  }

  const isSelected = (t: MapboxDestination) =>
    destination?.styleUrl === t.styleUrl && destination?.styleId === t.styleId

  const renderCard = (t: MapboxDestination) => {
    const selected = isSelected(t)
    return (
      <button
        key={`${t.styleId}-${t.styleUrl}`}
        onClick={() => handleSelect(t)}
        style={{
          display: 'flex', flexDirection: 'column', textAlign: 'left', padding: 0, overflow: 'hidden',
          borderRadius: 16, cursor: 'pointer', background: colors.white,
          border: `2px solid ${selected ? colors.toroRed : colors.gray200}`,
          boxShadow: selected ? '0 8px 24px rgba(215,25,32,0.16)' : '0 1px 2px rgba(16,24,40,0.04)',
          transition: 'all 0.16s ease', position: 'relative',
        }}
      >
        <div style={{ position: 'relative', height: 128, background: colors.gray100 }}>
          <img
            src={styleThumb(t.styleUrl, lng, lat)}
            alt={t.styleName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.currentTarget.style.visibility = 'hidden') }}
          />
          {selected && (
            <span style={{
              position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 999,
              background: colors.toroRed, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(215,25,32,0.4)',
            }}>
              <Icons.Check size={15} strokeWidth={3} />
            </span>
          )}
        </div>
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: selected ? colors.toroRed : colors.gray400, flexShrink: 0 }}><Icons.Layers size={15} /></span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.styleName}</span>
          </div>
          <div style={{ fontSize: 12, color: colors.gray500, marginTop: 4, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.styleId}</div>
        </div>
      </button>
    )
  }

  if (!selectedCourse) return <div style={{ color: colors.error }}>Please select a course first.</div>

  const gridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Context banner */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', background: colors.toroRedTint, border: `1px solid ${colors.toroRed}22`, borderRadius: 14 }}>
        <span style={{ color: colors.toroRed, marginTop: 1 }}><Icons.Globe size={20} /></span>
        <div style={{ fontSize: 13.5, color: colors.ink, lineHeight: 1.5, flex: 1 }}>
          <strong>{selectedCourse.name}</strong> is configured for the{' '}
          <EnvBadge env={selectedCourse.environment} /> environment. Choose the Mapbox map this overlay will be aligned against and published onto.
        </div>
      </div>

      {/* Account styles */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>Your Mapbox maps</div>
            <div style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>Styles pulled live from your Mapbox account.</div>
          </div>
          {!loading && (
            <button onClick={loadStyles} style={{ fontSize: 13, fontWeight: 600, color: colors.toroRed, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>
              Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div style={gridStyle}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 190, borderRadius: 16 }} />
            ))}
          </div>
        ) : accountStyles.length > 0 ? (
          <div style={gridStyle}>{accountStyles.map(renderCard)}</div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: colors.gray50, border: `1px solid ${colors.gray200}`, borderRadius: 12 }}>
            <span style={{ color: colors.gray400, marginTop: 1 }}><Icons.Map size={18} /></span>
            <div style={{ fontSize: 13, color: colors.gray700, lineHeight: 1.5 }}>
              {error
                ? <>Couldn't load account styles ({error}). This usually means the access token lacks the <code style={{ fontFamily: 'var(--font-mono)' }}>styles:list</code> scope. You can still publish to a standard basemap below.</>
                : <>No custom styles found on this account yet. Publish to a standard basemap below.</>}
            </div>
          </div>
        )}
      </div>

      {/* Standard basemaps */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>Standard basemaps</div>
          <div style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>Mapbox base styles — always available as a publish target.</div>
        </div>
        <div style={gridStyle}>{standardTargets.map(renderCard)}</div>
      </div>
    </div>
  )
}

export default Step2ChooseDestination
