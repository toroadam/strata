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

const LIST_TOKEN_KEY = 'strata-mapbox-list-token'

const styleThumb = (styleUrl: string, lng: number, lat: number, token: string) => {
  const path = styleUrl.replace('mapbox://styles/', '')
  return `https://api.mapbox.com/styles/v1/${path}/static/${lng},${lat},12.5,0/280x170@2x?access_token=${token}&attribution=false&logo=false`
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
  // A user-supplied token with the styles:list scope, kept ONLY in this browser
  // (localStorage) — never committed to the repo or the published site.
  const [listToken, setListToken] = useState<string>(() => {
    try { return localStorage.getItem(LIST_TOKEN_KEY) || '' } catch { return '' }
  })
  const [tokenInput, setTokenInput] = useState('')
  const [showConnect, setShowConnect] = useState(false)

  const lng = selectedCourse?.location.longitude ?? -98.5
  const lat = selectedCourse?.location.latitude ?? 39.8

  const loadStyles = async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      if (!token) throw new Error('No Mapbox token configured.')
      const styles = await fetchMapStyles(token)
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
    // Only attempt a live fetch if the user has connected a token; the default
    // public token lacks the styles:list scope and would just 403.
    if (listToken) loadStyles(listToken)
    else { setLoading(false); setAccountStyles([]) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const connectToken = async () => {
    const t = tokenInput.trim()
    if (!t) return
    try { localStorage.setItem(LIST_TOKEN_KEY, t) } catch {}
    setListToken(t)
    setTokenInput('')
    setShowConnect(false)
    await loadStyles(t)
  }

  const disconnectToken = () => {
    try { localStorage.removeItem(LIST_TOKEN_KEY) } catch {}
    setListToken('')
    setAccountStyles([])
    setError(null)
    setShowConnect(false)
  }

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
            src={styleThumb(t.styleUrl, lng, lat, t.fromAccount ? (listToken || MAPBOX_TOKEN) : MAPBOX_TOKEN)}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>Your Mapbox maps</div>
            <div style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>
              {listToken ? 'Styles pulled live from your connected Mapbox account.' : 'Connect your account to publish onto your own styles.'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {listToken && (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: colors.success, background: colors.successTint, padding: '4px 9px', borderRadius: 999 }}>
                  <Icons.Check size={13} strokeWidth={3} /> Connected
                </span>
                {!loading && (
                  <button onClick={() => loadStyles(listToken)} style={{ fontSize: 13, fontWeight: 600, color: colors.toroRed, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>Refresh</button>
                )}
                <button onClick={disconnectToken} style={{ fontSize: 13, fontWeight: 600, color: colors.gray500, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>Disconnect</button>
              </>
            )}
            {!listToken && !showConnect && (
              <button onClick={() => setShowConnect(true)} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: colors.toroRed, border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icons.Globe size={15} /> Connect account
              </button>
            )}
          </div>
        </div>

        {/* Connect token panel */}
        {(showConnect || (error && listToken)) && (
          <div style={{ padding: '16px 18px', background: colors.gray50, border: `1px solid ${colors.gray200}`, borderRadius: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, color: colors.ink, fontWeight: 600, marginBottom: 4 }}>Paste a Mapbox token with the <code style={{ fontFamily: 'var(--font-mono)' }}>styles:list</code> scope</div>
            <div style={{ fontSize: 12.5, color: colors.gray500, lineHeight: 1.5, marginBottom: 12 }}>
              Create one at <span style={{ fontFamily: 'var(--font-mono)', color: colors.gray700 }}>account.mapbox.com/access-tokens</span> with the <strong>styles:list</strong> scope enabled. It's stored only in this browser — never uploaded or committed.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') connectToken() }}
                placeholder="sk.eyJ1Ijoi…"
                autoFocus
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${colors.gray200}`, fontSize: 13.5, fontFamily: 'var(--font-mono)', outline: 'none', color: colors.ink }}
              />
              <button onClick={connectToken} disabled={!tokenInput.trim()} style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', background: tokenInput.trim() ? colors.toroRed : colors.gray300, border: 'none', cursor: tokenInput.trim() ? 'pointer' : 'default', padding: '10px 18px', borderRadius: 10 }}>Connect</button>
              {!listToken && (
                <button onClick={() => setShowConnect(false)} style={{ fontSize: 13.5, fontWeight: 600, color: colors.gray500, background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 12px' }}>Cancel</button>
              )}
            </div>
            {error && listToken && (
              <div style={{ fontSize: 12.5, color: colors.error, marginTop: 10 }}>Couldn't load styles: {error}</div>
            )}
          </div>
        )}

        {loading ? (
          <div style={gridStyle}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 190, borderRadius: 16 }} />
            ))}
          </div>
        ) : accountStyles.length > 0 ? (
          <div style={gridStyle}>{accountStyles.map(renderCard)}</div>
        ) : !showConnect && !(error && listToken) ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: colors.gray50, border: `1px solid ${colors.gray200}`, borderRadius: 12 }}>
            <span style={{ color: colors.gray400, marginTop: 1 }}><Icons.Map size={18} /></span>
            <div style={{ fontSize: 13, color: colors.gray700, lineHeight: 1.5 }}>
              {listToken
                ? <>No custom styles found on this account yet. Publish to a standard basemap below.</>
                : <>Not connected — publish to a standard basemap below, or <button onClick={() => setShowConnect(true)} style={{ background: 'transparent', border: 'none', padding: 0, color: colors.toroRed, fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>connect your Mapbox account</button> to use your own styles.</>}
            </div>
          </div>
        ) : null}
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
