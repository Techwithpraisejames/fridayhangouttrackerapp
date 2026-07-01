import { useState, useEffect, useRef } from 'react'
import './App.css'

const MEMBERS = [
  'William', 'Blessing', 'Praise', 'Rocio', 'Asjad',
  'Tahir', 'Vivian', 'Richard', 'Kring', 'Henry',
  'Linda', 'Emmanuel', 'Hemanth', 'Oleksandra', 'Volo',
]

const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']

const LOADING_MESSAGES = [
  "Checking if it's actually Friday...",
  "Convincing Blessing to ignore syncs for 30 minutes.",
  "Calculating your excuse for last week...",
  "Almost there, grabbing snacks 🍿",
]

// Returns every Friday in the current calendar month — no cap, no padding
function getMonthFridays() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const fridays = []
  const d = new Date(year, month, 1)
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7))
  while (d.getMonth() === month) {
    fridays.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return fridays
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatSlot(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isFutureFriday(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d > today
}

// Default to today if Friday, otherwise the most recent past Friday
function getDefaultFriday(fridays) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eligible = fridays.filter(f => {
    const d = new Date(f)
    d.setHours(0, 0, 0, 0)
    return d <= today
  })
  if (eligible.length) return formatDate(eligible[eligible.length - 1])
  return fridays.length ? formatDate(fridays[0]) : ''
}

// Returns true only once every Friday in the month has fully passed
function isMonthOver(fridays) {
  if (!fridays.length) return false
  const last = fridays[fridays.length - 1]
  const end = new Date(last)
  end.setHours(23, 59, 59, 999)
  return new Date() > end
}

function getRewardMessage(score, total) {
  if (total === 0) return 'No Fridays this month.'
  const pct = score / total
  if (pct === 1)   return "Okay legend, I see you! You showed up every single Friday this month. Bring this same energy next month 🏆"
  if (pct >= 0.75) return "You did good this month, but you know what's better👀? Don't miss any Friday next month and you will become unstoppable 💜"
  if (pct >= 0.5)  return "You made it halfway and that is a start. Next month has fresh Fridays waiting for you 🙌"
  if (pct > 0)     return "We caught a glimpse of you this month. Next month, let us see more of you 👀"
  return "We missed you this month. The good news is next month is another chance to shock us. See you Friday 💙"
}

function getScoreCaption(score, total) {
  if (score === 0)          return 'No check-ins yet — show up this Friday!'
  if (score === total)      return 'Perfect attendance! Legend 🏆'
  if (score === total - 1)  return `Almost perfect — one more Friday!`
  if (score >= Math.ceil(total / 2)) return 'Halfway there, keep showing up!'
  return 'A start! Keep the streak going 💪'
}

function initAttendance() {
  const data = {}
  MEMBERS.forEach(member => {
    data[member] = {}
    WEEKS.forEach(week => { data[member][week] = false })
  })
  return data
}

// ── Icons ──────────────────────────────────────────────────────────
function IconCheckin({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#39C934' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  )
}

function IconMyMonth({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#39C934' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  )
}

function IconLeaderboard({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#39C934' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
      <rect x="2" y="14" width="5" height="8" rx="1"/>
      <rect x="9" y="9" width="5" height="13" rx="1"/>
      <rect x="16" y="4" width="5" height="18" rx="1"/>
    </svg>
  )
}

function IconHistory({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#39C934' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 650)
    const fadeTimer = setTimeout(() => setFadingOut(true), 2450)
    const removeTimer = setTimeout(() => setLoading(false), 3000)
    return () => {
      clearInterval(msgTimer)
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  const [tab, setTab] = useState('checkin')
  const [attendance, setAttendance] = useState(initAttendance)
  const [activeWeek, setActiveWeek] = useState('Week 1')

  const fridays = getMonthFridays()
  const monthComplete = isMonthOver(fridays)

  const todayIsFriday = new Date().getDay() === 5

  const [checkName, setCheckName] = useState(MEMBERS[0])
  const [checkDate, setCheckDate] = useState(() => getDefaultFriday(fridays))
  const [futureWarnMsg, setFutureWarnMsg] = useState(false)
  const [pressing, setPressing] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const [checkinLog, setCheckinLog] = useState({})
  const [profileName, setProfileName] = useState(null)
  const [streakMap, setStreakMap] = useState({})

  function handleCheckin() {
    const name = checkName
    if (!name) return
    setCheckinLog(prev => {
      const existing = prev[name] ? new Set(prev[name]) : new Set()
      existing.add(checkDate)
      return { ...prev, [name]: existing }
    })
    // Auto-mark the corresponding week in the attendance panel
    const fridayIndex = fridays.findIndex(f => formatDate(f) === checkDate)
    if (fridayIndex !== -1 && fridayIndex < WEEKS.length) {
      const week = WEEKS[fridayIndex]
      setAttendance(prev => ({
        ...prev,
        [name]: { ...prev[name], [week]: true },
      }))
    }
    setProfileName(name)
    clearTimeout(toastTimer.current)
    setToast('Attendance marked! See you next Friday 👋')
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (!monthComplete || !profileName) return
    const checkins = checkinLog[profileName] ?? new Set()
    const s = fridays.filter(f => checkins.has(formatDate(f))).length
    setStreakMap(prev => ({
      ...prev,
      [profileName]: s === fridays.length ? (prev[profileName] ?? 0) + 1 : 0,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthComplete, profileName])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function toggle(member) {
    setAttendance(prev => ({
      ...prev,
      [member]: { ...prev[member], [activeWeek]: !prev[member][activeWeek] },
    }))
  }

  function totalStreak(member) {
    return WEEKS.filter(w => attendance[member][w]).length
  }

  const weekAttendees = MEMBERS.filter(m => attendance[m][activeWeek])
  const totalFridays = fridays.length
  const myCheckins = profileName && checkinLog[profileName] ? checkinLog[profileName] : new Set()
  const score = fridays.filter(f => myCheckins.has(formatDate(f))).length
  const showReward = profileName && monthComplete
  const monthStreak = profileName ? (streakMap[profileName] ?? 0) : 0
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })

  const crewRanked = Object.entries(checkinLog)
    .map(([name, dateSet]) => ({
      name,
      crewScore: fridays.filter(f => dateSet.has(formatDate(f))).length,
    }))
    .sort((a, b) => b.crewScore - a.crewScore)

  return (
    <>
      {loading && (
        <div className={`loading-screen${fadingOut ? ' fading' : ''}`}>
          <p className="loading-brand">Hackmamba</p>
          <div className="loading-spinner-wrap">
            <div className="loading-spinner-pulse" />
            <div className="loading-spinner" />
          </div>
          <p className="loading-msg">{LOADING_MESSAGES[loadingMsgIdx]}</p>
        </div>
      )}
    <div className="app">
      {toast && <div className="toast">{toast}</div>}

      {/* Fixed header */}
      <header className="header">
        <p className="brand">Hackmamba</p>
        <h1 className="title">Friday Hangout Tracker</h1>
        <p className="tagline">Show up. Stack up.</p>
      </header>

      {/* Scrollable tab content */}
      <main className="tab-content">

        {/* ── CHECK IN TAB ── */}
        {tab === 'checkin' && (
          <div className="tab-pane">
            {monthComplete && (
              <div className="empty-state">
                <p className="empty-icon">🔒</p>
                <p className="empty-title">{monthName} is locked</p>
                <p className="empty-body">All Fridays for {monthName} have passed. Check-ins are closed. View your record in History.</p>
                <button className="empty-cta" onClick={() => setTab('history')}>View History</button>
              </div>
            )}
            {!monthComplete && <section className="glass card checkin-card">
              <h2 className="section-label">Check In</h2>
              <div className="checkin-fields">
                <select className="checkin-select" value={checkName} onChange={e => setCheckName(e.target.value)}>
                  {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  className="checkin-select"
                  value={checkDate}
                  onChange={e => {
                    const val = e.target.value
                    const friday = fridays.find(f => formatDate(f) === val)
                    if (friday && isFutureFriday(friday)) {
                      setFutureWarnMsg(true)
                      setTimeout(() => setFutureWarnMsg(false), 3000)
                      return
                    }
                    setFutureWarnMsg(false)
                    setCheckDate(val)
                  }}
                >
                  {fridays.map(f => {
                    const future = isFutureFriday(f)
                    return (
                      <option key={f.toISOString()} value={formatDate(f)} disabled={future}>
                        {future ? `🔒 ${formatDate(f)}` : formatDate(f)}
                      </option>
                    )
                  })}
                </select>
                {futureWarnMsg && (
                  <p className="future-warn">You can only check in on the actual Friday 👀</p>
                )}
              </div>
              <div className="checkin-btn-wrap">
                <button
                  className={`checkin-btn${pressing ? ' pressing' : ''}`}
                  disabled={!todayIsFriday}
                  title={!todayIsFriday ? 'Check-ins only open on Fridays. See you then 💜' : undefined}
                  onMouseDown={() => setPressing(true)}
                  onMouseUp={() => { setPressing(false); handleCheckin() }}
                  onMouseLeave={() => setPressing(false)}
                  onTouchStart={() => setPressing(true)}
                  onTouchEnd={() => { setPressing(false); handleCheckin() }}
                >
                  I'm Here 🎉
                </button>
                {!todayIsFriday && (
                  <p className="btn-day-msg">Check-ins only open on Fridays. See you then 💜</p>
                )}
              </div>
            </section>}

            {!monthComplete && <section className="glass card week-selector">
              <h2 className="section-label">Mark Attendance</h2>
              <div className="week-tabs">
                {WEEKS.map(week => (
                  <button
                    key={week}
                    className={`week-tab${activeWeek === week ? ' active' : ''}`}
                    onClick={() => setActiveWeek(week)}
                  >
                    {week}
                  </button>
                ))}
              </div>
            </section>}

            {!monthComplete && <section className="glass card attendance-panel">
              <div className="panel-header">
                <h2 className="section-label">{activeWeek}</h2>
                <span className="pill">{weekAttendees.length} / {MEMBERS.length} present</span>
              </div>
              <ul className="member-list">
                {MEMBERS.map(member => {
                  const present = attendance[member][activeWeek]
                  return (
                    <li key={member} className={`member-row${present ? ' present' : ''}`} onClick={() => toggle(member)}>
                      <div className="avatar">{member.charAt(0)}</div>
                      <span className="member-name">{member}</span>
                      <span className="streak-badge">{totalStreak(member)} wks</span>
                      <span className={`status-dot ${present ? 'on' : 'off'}`} />
                    </li>
                  )
                })}
              </ul>
            </section>}
          </div>
        )}

        {/* ── MY MONTH TAB ── */}
        {tab === 'mymonth' && (
          <div className="tab-pane">
            {!profileName ? (
              <div className="empty-state">
                <p className="empty-icon">🗓️</p>
                <p className="empty-title">No check-in yet</p>
                <p className="empty-body">Head to Check In and tap "I'm Here" to see your month tracker.</p>
                <button className="empty-cta" onClick={() => setTab('checkin')}>Go to Check In</button>
              </div>
            ) : (
              <>
                <section className="glass card my-month-card">
                  <div className="my-month-header">
                    <div>
                      <h2 className="section-label">My Month</h2>
                      <p className="my-month-name">{profileName}</p>
                    </div>
                    <span className="month-badge">{monthName}</span>
                  </div>

                  <div className={`friday-slots slots-${totalFridays}`}>
                    {fridays.map((friday, i) => {
                      const attended = myCheckins.has(formatDate(friday))
                      return (
                        <div key={i} className={`friday-slot${attended ? ' attended' : ''}`}>
                          <div className={`slot-circle${attended ? ' checked' : ''}`}>
                            {attended && (
                              <svg viewBox="0 0 20 20" fill="none" className="checkmark-icon">
                                <path d="M4 10l4.5 4.5L16 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="slot-label">{formatSlot(friday)}</span>
                          <span className="slot-week">Fri {i + 1}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="score-row">
                    <div className="score-bar-wrap">
                      <div className="score-bar" style={{ width: `${totalFridays ? (score / totalFridays) * 100 : 0}%` }} />
                    </div>
                    <span className="score-text">
                      <span className="score-num">{score}</span>
                      <span className="score-denom"> / {totalFridays}</span>
                    </span>
                  </div>
                  <p className="score-caption">{getScoreCaption(score, totalFridays)}</p>
                </section>

                {showReward && (
                  <section className="reward-card">
                    <div className="reward-glow" />
                    <div className="reward-inner">
                      <p className="reward-label">Month Wrap-Up</p>
                      <p className="reward-score-display">{score} / {totalFridays}</p>
                      <p className="reward-message">{getRewardMessage(score, totalFridays)}</p>
                      {monthStreak > 0 && (
                        <div className="streak-chip">🔥 {monthStreak} month streak</div>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === 'leaderboard' && (
          <div className="tab-pane">
            <section className="glass card crew-leaderboard">
              <h2 className="section-label crew-title">This Month's Crew 🎯</h2>
              {crewRanked.length === 0 ? (
                <p className="crew-empty">No check-ins yet. Be the first to show up!</p>
              ) : (
                <ol className="crew-list">
                  {crewRanked.map(({ name, crewScore }, i) => (
                    <li key={name} className={`crew-row${crewScore === totalFridays ? ' perfect' : ''}`}>
                      <span className={`crew-rank rank-${Math.min(i + 1, 4)}`}>#{i + 1}</span>
                      <div className={`crew-avatar${crewScore === totalFridays ? ' crown-avatar' : ''}`}>{name.charAt(0)}</div>
                      <span className="crew-name">{name}</span>
                      {crewScore === totalFridays && <span className="crown">👑</span>}
                      <div className="crew-score-wrap">
                        <div className="crew-pips">
                          {fridays.map((_, pi) => (
                            <span key={pi} className={`pip${pi < crewScore ? ' filled' : ''}`} />
                          ))}
                        </div>
                        <span className="crew-score-text">{crewScore}/{totalFridays}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="glass card leaderboard">
              <h2 className="section-label">Streak Leaderboard</h2>
              <ol className="leader-list">
                {[...MEMBERS]
                  .sort((a, b) => totalStreak(b) - totalStreak(a))
                  .map((member, i) => (
                    <li key={member} className="leader-row">
                      <span className={`rank rank-${Math.min(i + 1, 4)}`}>#{i + 1}</span>
                      <span className="member-name">{member}</span>
                      <div className="streak-bar-wrap">
                        <div className="streak-bar" style={{ width: `${(totalStreak(member) / WEEKS.length) * 100}%` }} />
                      </div>
                      <span className="streak-count">{totalStreak(member)}</span>
                    </li>
                  ))}
              </ol>
            </section>
          </div>
        )}
        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="tab-pane">
            {!monthComplete ? (
              <div className="empty-state">
                <p className="empty-icon">🔒</p>
                <p className="empty-title">No history yet</p>
                <p className="empty-body">Completed months will appear here once all Fridays have passed.</p>
              </div>
            ) : !profileName ? (
              <div className="empty-state">
                <p className="empty-icon">🗓️</p>
                <p className="empty-title">Who are you?</p>
                <p className="empty-body">Select your name in Check In to view your attendance history.</p>
                <button className="empty-cta" onClick={() => setTab('checkin')}>Go to Check In</button>
              </div>
            ) : (
              <section className="glass card history-month-card">
                <div className="history-card-header">
                  <div>
                    <h2 className="section-label">History</h2>
                    <p className="history-month-name">{profileName} · {monthName} {new Date().getFullYear()}</p>
                  </div>
                  <span className="lock-badge">🔒 Locked</span>
                </div>

                <div className={`friday-slots slots-${totalFridays}`}>
                  {fridays.map((friday, i) => {
                    const attended = myCheckins.has(formatDate(friday))
                    return (
                      <div key={i} className={`friday-slot${attended ? ' attended' : ''}`}>
                        <div className={`slot-circle${attended ? ' checked' : ''}`}>
                          {attended && (
                            <svg viewBox="0 0 20 20" fill="none" className="checkmark-icon">
                              <path d="M4 10l4.5 4.5L16 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="slot-label">{formatSlot(friday)}</span>
                        <span className="slot-week">Fri {i + 1}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="score-row">
                  <div className="score-bar-wrap">
                    <div className="score-bar" style={{ width: `${totalFridays ? (score / totalFridays) * 100 : 0}%` }} />
                  </div>
                  <span className="score-text">
                    <span className="score-num">{score}</span>
                    <span className="score-denom"> / {totalFridays}</span>
                  </span>
                </div>

                <p className="history-reward-msg">{getRewardMessage(score, totalFridays)}</p>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Fixed bottom nav */}
      <nav className="bottom-nav">
        {[
          { id: 'checkin',     label: 'Check In',    Icon: IconCheckin },
          { id: 'mymonth',     label: 'My Month',    Icon: IconMyMonth },
          { id: 'history',     label: 'History',     Icon: IconHistory },
          { id: 'leaderboard', label: 'Leaderboard', Icon: IconLeaderboard },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-btn${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon active={tab === id} />
            <span className="nav-label">{label}</span>
            {tab === id && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>
    </div>
    </>
  )
}
