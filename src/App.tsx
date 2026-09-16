import { useEffect, useRef, useState } from 'react'
import {
  fetchCloudTrips,
  fetchHealth,
  fetchMe,
  generatePlan,
  login,
  logout,
  register,
  saveCloudTrip,
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
import type { ItineraryDay, TripPlan } from './lib/types'
import { formatTotalDrive } from './lib/generateItinerary'
import './App.css'

const EXAMPLE =
  'Driving for 5 days, need to hit the hills, prefer vegetarian food stops along the highway. Starting near Denver if that works.'

const EXAMPLES = [
  EXAMPLE,
  'Weekend coastal run from SF toward Big Sur. Seafood ok. Keep it scenic and not too rushed.',
  'Week-long desert trip—Phoenix through Sedona and Grand Canyon. Local food, lots of overlooks.',
]

function StopIcon({ type }: { type: string }) {
  const label =
    type === 'drive'
      ? '→'
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
          <p>{day.summary}</p>
        </div>
        <div className="day__drive">
          <span className="day__drive-time">{day.driveLabel}</span>
          <span className="day__drive-label">
            {day.driveMiles ? `${day.driveMiles} mi · ` : ''}driving
          </span>
        </div>
        <span className="day__chevron" aria-hidden="true" />
      </button>
      <div className="day__body" hidden={!open}>
        <a className="map-link map-link--day" href={day.mapUrl} target="_blank" rel="noreferrer">
          Open day’s route in Google Maps
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
  const [authOpen, setAuthOpen] = useState(false)
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
      const bits = ['Live routing']
      if (health.places) bits.push('OSM places')
      if (health.database) bits.push('Postgres')
      bits.push(health.llm ? 'AI on' : 'add OPENAI_API_KEY for AI')
      setStatus(bits.join(' · '))
      if (me.user) {
        try {
          setCloudTrips(await fetchCloudTrips())
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

  async function handleGenerate() {
    const text = notes.trim()
    if (text.length < 8) {
      setError('Drop a few more details—days, vibes, food, where you want to start.')
      return
    }
    setError(null)
    setGenerating(true)
    try {
      const next = await generatePlan(text)
      setPlan(next)
      setOpenDay(1)
      clearShareHash()
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

  async function handleAuthSubmit(e: React.FormEvent) {
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
    setToast('Signed out')
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
            <button type="button" className="ghost-btn" onClick={() => void handleLogout()}>
              {user.name || user.email}
            </button>
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
              Dump your rough notes—days, vibes, food quirks—and get a day-by-day route with live drive times, real food
              stops, and Postgres-backed saves.
            </p>

            <div className={`composer ${busy ? 'composer--busy' : ''}`}>
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
                      }}
                    >
                      {i === 0 ? 'Hills · vegetarian' : i === 1 ? 'Coastal weekend' : 'Desert week'}
                    </button>
                  ))}
                </div>
                <button type="button" className="generate" onClick={() => void handleGenerate()} disabled={busy}>
                  {busy ? <span className="generate__pulse">Plotting route…</span> : 'Generate'}
                </button>
              </div>
              {error ? <p className="composer__error">{error}</p> : null}
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
                  <dt>Total drive</dt>
                  <dd>{formatTotalDrive(plan.totalDriveMinutes)}</dd>
                </div>
                <div>
                  <dt>Food lens</dt>
                  <dd>{plan.intent.food === 'any' ? 'Flexible' : plan.intent.food}</dd>
                </div>
                <div>
                  <dt>Engine</dt>
                  <dd>
                    {plan.meta.engine === 'llm' ? 'AI' : 'Smart parser'}
                    {plan.meta.routing === 'osrm' ? ' · live ETA' : ''}
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
          TripPlanner uses live OpenStreetMap routing, Overpass places, and PostgreSQL for accounts and trip history.
        </p>
      </footer>

      {authOpen ? (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <form className="auth-card" onSubmit={(e) => void handleAuthSubmit(e)}>
            <h2 id="auth-title">{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <p>Accounts and trips are stored in PostgreSQL.</p>
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

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
