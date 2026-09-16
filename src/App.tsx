import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  fetchCloudTrips,
  fetchHealth,
  fetchMe,
  fetchNearby,
  fetchSettings,
  generatePlan,
  login,
  logout,
  register,
  saveCloudTrip,
  saveSettings,
  type AuthUser,
  type CloudTrip,
} from './lib/api'
import {
  clearShareHash,
  encodeShareUrl,
  listSavedTrips,
  readSharedPlan,
  saveTrip,
  type SavedTrip,
} from './lib/storage'
import type { ItineraryDay, LlmProvider, NearbyDestination, TravelMode, TripPlan, UserSettingsPublic } from './lib/types'
import { formatTotalDrive } from './lib/generateItinerary'
import './App.css'

const EXAMPLE =
  '3-day trip from Mumbai toward the hills, prefer vegetarian food, mix of cafes and viewpoints.'

const EXAMPLES = [
  EXAMPLE,
  'Weekend train trip Delhi to Jaipur and Agra. Heritage forts, local food.',
  'Bike ride Bengaluru to Mysuru and Coorg for 4 days. Slow pace, coffee estates.',
]

const MODES: Array<{ id: TravelMode; label: string }> = [
  { id: 'car', label: 'Car' },
  { id: 'bike', label: 'Bike' },
  { id: 'bus', label: 'Bus' },
  { id: 'train', label: 'Train' },
]

const PROVIDERS: Array<{ id: LlmProvider; label: string; placeholder: string }> = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...' },
  { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...' },
]

function StopIcon({ type }: { type: string }) {
  const label =
    type === 'drive'
      ? '→'
      : type === 'transit'
        ? '⇄'
        : type === 'food'
          ? '◉'
          : type === 'lodging'
            ? '⌂'
            : type === 'sight'
              ? '◈'
              : '✦'
  return <span className="stop-icon" aria-hidden="true">{label}</span>
}

function DayPanel({ day, open, onToggle }: { day: ItineraryDay; open: boolean; onToggle: () => void }) {
  return (
    <article className={`day ${open ? 'day--open' : ''}`}>
      <button type="button" className="day__header" onClick={onToggle} aria-expanded={open}>
        <div className="day__badge">Day {day.day}</div>
        <div className="day__meta">
          <h3>{day.title}</h3>
          <p>
            {day.summary}
            {day.transitHint ? ` · ${day.transitHint}` : ''}
          </p>
        </div>
        <div className="day__drive">
          <span className="day__drive-time">{day.driveLabel}</span>
          <span className="day__drive-label">
            {day.driveMiles ? `${day.driveMiles} mi · ` : ''}
            {day.mode}
          </span>
        </div>
        <span className="day__chevron" aria-hidden="true" />
      </button>
      <div className="day__body" hidden={!open}>
        <a className="map-link map-link--day" href={day.mapUrl} target="_blank" rel="noreferrer">
          {day.mode === 'train' || day.mode === 'bus' ? 'Open booking / route link' : 'Open day’s route in Google Maps'}
        </a>
        <ol className="stops">
          {day.stops.map((stop) => (
            <li key={stop.id} className={`stop stop--${stop.type}`}>
              <time>{stop.time}</time>
              <div className="stop__content">
                <div className="stop__title-row">
                  <StopIcon type={stop.type} />
                  <strong>{stop.title}</strong>
                </div>
                <p>{stop.detail}</p>
                {stop.durationMinutes ? (
                  <span className="stop__duration">{stop.durationMinutes} min</span>
                ) : null}
                {stop.mapUrl ? (
                  <a className="map-link" href={stop.mapUrl} target="_blank" rel="noreferrer">
                    Map
                  </a>
                ) : null}
                {stop.bookingUrl ? (
                  <a className="map-link" href={stop.bookingUrl} target="_blank" rel="noreferrer">
                    Book
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </article>
  )
}

export default function App() {
  const [notes, setNotes] = useState(() => readSharedPlan()?.intent.raw ?? '')
  const [plan, setPlan] = useState<TripPlan | null>(() => readSharedPlan())
  const [openDay, setOpenDay] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Checking routing…')
  const [localSaved, setLocalSaved] = useState<SavedTrip[]>(() => listSavedTrips())
  const [cloudTrips, setCloudTrips] = useState<CloudTrip[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)
  const [database, setDatabase] = useState(false)
  const [mode, setMode] = useState<TravelMode>('car')
  const [location, setLocation] = useState<{ lat: number; lon: number; label?: string } | null>(null)
  const [nearby, setNearby] = useState<NearbyDestination[]>([])
  const [destinationHint, setDestinationHint] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<UserSettingsPublic | null>(null)
  const [keyDrafts, setKeyDrafts] = useState<Partial<Record<LlmProvider, string>>>({})
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void (async () => {
      const [health, me] = await Promise.all([fetchHealth(), fetchMe()])
      setDatabase(Boolean(health?.database || me.database))
      setUser(me.user)
      if (!health) {
        setStatus('Offline mode · local planner')
        return
      }
      const bits = ['India focus', 'Live routing', 'OSM places']
      if (health.database) bits.push('Postgres')
      bits.push(me.user ? 'Bring your own LLM key' : 'Sign in to add LLM keys')
      setStatus(bits.join(' · '))
      if (me.user) {
        try {
          setCloudTrips(await fetchCloudTrips())
          const s = await fetchSettings()
          setSettings(s)
          setMode(s.preferredMode)
        } catch {
          // ignore
        }
      }
    })()
  }, [])

  useEffect(() => {
    if (plan && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [plan])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!location) return
    void fetchNearby({ lat: location.lat, lon: location.lon, mode })
      .then(setNearby)
      .catch(() => setNearby([]))
  }, [location, mode])

  async function handleLocate() {
    if (!navigator.geolocation) {
      setToast('Geolocation not supported in this browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        })
        setLocating(false)
        setToast('Location captured · nearby India destinations loaded')
      },
      () => {
        setLocating(false)
        setToast('Could not read location · allow location access and retry')
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  async function handleGenerate() {
    const text = notes.trim()
    if (text.length < 8) {
      setError('Drop a few more details—days, vibes, food, where you want to start.')
      return
    }
    setError(null)
    setGenerating(true)
    try {
      const next = await generatePlan({
        notes: text,
        mode,
        location: location ?? undefined,
        destinationHint: destinationHint ?? undefined,
      })
      setPlan(next)
      setOpenDay(1)
      clearShareHash()
      if (next.nearbySuggestions?.length) setNearby(next.nearbySuggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!plan) return
    setLocalSaved(saveTrip(plan))
    if (user && database) {
      try {
        const trip = await saveCloudTrip(plan)
        setCloudTrips((prev) => [trip, ...prev.filter((t) => t.planId !== trip.planId)].slice(0, 50))
        setToast('Saved to PostgreSQL')
        return
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Cloud save failed · kept local copy')
        return
      }
    }
    setToast(database ? 'Sign in to save to Postgres' : 'Saved on this device')
  }

  async function handleShare() {
    if (!plan) return
    const url = encodeShareUrl(plan)
    try {
      await navigator.clipboard.writeText(url)
      setToast('Share link copied')
    } catch {
      setToast(url)
    }
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault()
    setAuthBusy(true)
    setAuthError(null)
    try {
      const next =
        authMode === 'login'
          ? await login({ email: authEmail, password: authPassword })
          : await register({ email: authEmail, password: authPassword, name: authName })
      setUser(next)
      setAuthOpen(false)
      setCloudTrips(await fetchCloudTrips())
      const s = await fetchSettings()
      setSettings(s)
      setMode(s.preferredMode)
      setToast(authMode === 'login' ? 'Signed in' : 'Account created')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleLogout() {
    await logout()
    setUser(null)
    setCloudTrips([])
    setSettings(null)
    setToast('Signed out')
  }

  async function handleSettingsSave(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    try {
      const next = await saveSettings({
        preferredProvider: settings.preferredProvider,
        preferredModel: settings.preferredModel,
        preferredMode: settings.preferredMode,
        homeCity: settings.homeCity,
        keys: keyDrafts,
      })
      setSettings(next)
      setKeyDrafts({})
      setMode(next.preferredMode)
      setSettingsOpen(false)
      setToast(
        next.configuredProviders.length
          ? `Saved · ${next.configuredProviders.join(', ')} ready`
          : 'Settings saved',
      )
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not save settings')
    }
  }

  const busy = generating

  return (
    <div className={`app ${plan ? 'app--planned' : ''}`}>
      <header className="topbar">
        <a className="brand brand--nav" href="#top">
          TripPlanner
        </a>
        <div className="topbar__actions">
          <span className="status-pill" title="Generation backend status">
            {status}
          </span>
          {user ? (
            <>
              <button type="button" className="ghost-btn" onClick={() => setSettingsOpen(true)}>
                LLM keys
              </button>
              <button type="button" className="ghost-btn" onClick={() => void handleLogout()}>
                {user.name || user.email}
              </button>
            </>
          ) : database ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setAuthMode('login')
                setAuthOpen(true)
              }}
            >
              Sign in
            </button>
          ) : null}
          {plan ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setPlan(null)
                clearShareHash()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              New trip
            </button>
          ) : null}
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero__media" aria-hidden="true">
            <div className="hero__road" />
            <div className="hero__grain" />
            <div className="hero__vignette" />
          </div>

          <div className="hero__content">
            <p className="brand brand--hero">TripPlanner</p>
            <h1>Paste the mess. Drive the plan.</h1>
            <p className="hero__lede">
              India-first itineraries for car, bike, bus, and train—use your own LLM keys, current location, and nearby
              popular destinations.
            </p>

            <div className={`composer ${busy ? 'composer--busy' : ''}`}>
              <div className="mode-row" role="group" aria-label="Travel mode">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mode-chip ${mode === m.id ? 'mode-chip--active' : ''}`}
                    onClick={() => setMode(m.id)}
                    disabled={busy}
                  >
                    {m.label}
                  </button>
                ))}
                <button type="button" className="mode-chip" onClick={() => void handleLocate()} disabled={busy || locating}>
                  {locating ? 'Locating…' : location ? 'Location on' : 'Use my location'}
                </button>
              </div>

              {nearby.length ? (
                <div className="nearby">
                  <p className="nearby__label">Nearby popular destinations</p>
                  <div className="chips" role="list">
                    {nearby.map((place) => (
                      <button
                        key={`${place.name}-${place.state}`}
                        type="button"
                        className={`chip ${destinationHint === place.name ? 'chip--active' : ''}`}
                        role="listitem"
                        disabled={busy}
                        onClick={() => {
                          setDestinationHint(place.name)
                          setNotes((prev) =>
                            prev.includes(place.name)
                              ? prev
                              : `${prev.trim()}${prev.trim() ? ' ' : ''}Want to hit ${place.name} (${place.distanceKm} km, ${place.vibe}).`,
                          )
                        }}
                      >
                        {place.name} · {place.distanceKm} km
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="sr-only" htmlFor="brain-dump">
                Trip notes
              </label>
              <textarea
                id="brain-dump"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={EXAMPLE}
                rows={5}
                disabled={busy}
              />
              <div className="composer__footer">
                <div className="chips" role="list">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      className="chip"
                      role="listitem"
                      disabled={busy}
                      onClick={() => {
                        setNotes(ex)
                        setError(null)
                        if (i === 1) setMode('train')
                        if (i === 2) setMode('bike')
                        if (i === 0) setMode('car')
                      }}
                    >
                      {i === 0 ? 'Mumbai hills' : i === 1 ? 'Delhi rail circuit' : 'Bike to Coorg'}
                    </button>
                  ))}
                </div>
                <button type="button" className="generate" onClick={() => void handleGenerate()} disabled={busy}>
                  {busy ? <span className="generate__pulse">Plotting route…</span> : 'Generate'}
                </button>
              </div>
              {error ? <p className="composer__error">{error}</p> : null}
              {!user && database ? (
                <p className="composer__hint">Sign in and add your OpenAI / Gemini / Groq key to plan with your favourite LLM.</p>
              ) : null}
            </div>
          </div>
        </section>

        {plan ? (
          <section className="results" ref={resultsRef} aria-live="polite">
            <div className="results__intro">
              <div className="results__heading">
                <div>
                  <p className="eyebrow">Your itinerary</p>
                  <h2>{plan.title}</h2>
                  <p className="results__sub">{plan.subtitle}</p>
                </div>
                <div className="plan-actions">
                  <button type="button" className="text-btn" onClick={() => void handleSave()}>
                    {user ? 'Save to Postgres' : 'Save'}
                  </button>
                  <button type="button" className="text-btn" onClick={() => void handleShare()}>
                    Copy share link
                  </button>
                </div>
              </div>
              <dl className="stats">
                <div>
                  <dt>Days</dt>
                  <dd>{plan.days.length}</dd>
                </div>
                <div>
                  <dt>Total time</dt>
                  <dd>{formatTotalDrive(plan.totalDriveMinutes)}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>{plan.meta.mode}</dd>
                </div>
                <div>
                  <dt>Engine</dt>
                  <dd>
                    {plan.meta.engine === 'llm'
                      ? `${plan.meta.provider || 'AI'}${plan.meta.model ? ` · ${plan.meta.model}` : ''}`
                      : 'Smart parser'}
                    {plan.meta.routing === 'osrm' ? ' · live ETA' : ''}
                    {plan.meta.routing === 'transit' ? ' · transit' : ''}
                    {plan.meta.places === 'overpass' ? ' · places' : ''}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="timeline">
              {plan.days.map((day) => (
                <DayPanel
                  key={day.day}
                  day={day}
                  open={openDay === day.day}
                  onToggle={() => setOpenDay((d) => (d === day.day ? 0 : day.day))}
                />
              ))}
            </div>

            <aside className="tips">
              <h3>Travel notes</h3>
              <ul>
                {plan.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </aside>

            {cloudTrips.length ? (
              <aside className="saved">
                <h3>Saved in PostgreSQL</h3>
                <ul>
                  {cloudTrips.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="saved__item"
                        onClick={() => {
                          setPlan(item.plan)
                          setNotes(item.plan.intent.raw)
                          setMode(item.plan.intent.mode || 'car')
                          setOpenDay(1)
                        }}
                      >
                        <strong>{item.title}</strong>
                        <span>{new Date(item.updatedAt).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}

            {localSaved.length ? (
              <aside className="saved">
                <h3>Saved on this device</h3>
                <ul>
                  {localSaved.slice(0, 5).map((item) => (
                    <li key={item.plan.id}>
                      <button
                        type="button"
                        className="saved__item"
                        onClick={() => {
                          setPlan(item.plan)
                          setNotes(item.plan.intent.raw)
                          setMode(item.plan.intent.mode || 'car')
                          setOpenDay(1)
                        }}
                      >
                        <strong>{item.plan.title}</strong>
                        <span>{new Date(item.savedAt).toLocaleString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </section>
        ) : null}
      </main>

      <footer className="footer">
        <p>
          TripPlanner is India-first: BYO LLM keys, geolocation suggestions, OSRM road times, and IRCTC/redBus booking
          deep-links for train and bus modes.
        </p>
      </footer>

      {authOpen ? (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <form className="auth-card" onSubmit={(e) => void handleAuthSubmit(e)}>
            <h2 id="auth-title">{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <p>Accounts, trips, and encrypted LLM keys live in PostgreSQL.</p>
            {authMode === 'register' ? (
              <label>
                Name
                <input value={authName} onChange={(e) => setAuthName(e.target.value)} autoComplete="name" />
              </label>
            ) : null}
            <label>
              Email
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
            {authError ? <p className="composer__error">{authError}</p> : null}
            <div className="auth-actions">
              <button type="button" className="text-btn" onClick={() => setAuthOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="text-btn"
                onClick={() => setAuthMode((m) => (m === 'login' ? 'register' : 'login'))}
              >
                {authMode === 'login' ? 'Need an account?' : 'Have an account?'}
              </button>
              <button type="submit" className="generate" disabled={authBusy}>
                {authBusy ? 'Working…' : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {settingsOpen && settings ? (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <form className="auth-card auth-card--wide" onSubmit={(e) => void handleSettingsSave(e)}>
            <h2 id="settings-title">Your LLM keys</h2>
            <p>Keys are encrypted at rest in Postgres. Only you can use them for planning.</p>
            <label>
              Preferred provider
              <select
                value={settings.preferredProvider}
                onChange={(e) =>
                  setSettings({ ...settings, preferredProvider: e.target.value as LlmProvider })
                }
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {settings.configuredProviders.includes(p.id) ? ' · configured' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Model
              <input
                value={settings.preferredModel}
                onChange={(e) => setSettings({ ...settings, preferredModel: e.target.value })}
                placeholder="gpt-4o-mini / gemini-2.0-flash / ..."
              />
            </label>
            <label>
              Default mode
              <select
                value={settings.preferredMode}
                onChange={(e) =>
                  setSettings({ ...settings, preferredMode: e.target.value as TravelMode })
                }
              >
                {MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            {PROVIDERS.map((p) => (
              <label key={p.id}>
                {p.label} API key
                <input
                  type="password"
                  value={
                    keyDrafts[p.id] ??
                    (settings.configuredProviders.includes(p.id) ? '••••••••••••' : '')
                  }
                  placeholder={p.placeholder}
                  onChange={(e) => setKeyDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  autoComplete="off"
                />
              </label>
            ))}
            <div className="auth-actions">
              <button type="button" className="text-btn" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="generate">
                Save keys
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
