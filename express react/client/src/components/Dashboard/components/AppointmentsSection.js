import React from 'react'
import '../css/ServicesTeam.css'
import './AppointmentsSection.css'

const card = 'glass-card'

const formatDateTime = (date, time) => {
  if (!date && !time) return ''

  let displayDate = ''
  if (date) {
    const d = new Date(date)
    displayDate = Number.isNaN(d)
      ? String(date)
      : d.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  let displayTime = ''
  if (time) {
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      displayTime = time
    } else {
      const t = new Date(time)
      displayTime = Number.isNaN(t)
        ? ''
        : t.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return [displayDate, displayTime].filter(Boolean).join(' - ')
}

const AppointmentsSection = ({ appointments = [], onReload }) => {
  const hasData = appointments && appointments.length > 0

  return (
    <section id="appointments" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">Foglalások</p>
          <h2 className="text-2xl font-semibold text-white">Következő időpontok</h2>
        </div>
        {onReload && (
          <button
            onClick={onReload}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-xl hover:scale-[1.02] transition"
          >
            Frissítés
          </button>
        )}
      </div>
      {hasData ? (
        <div className="glass-grid">
          {appointments.slice(0, 6).map((appt, idx) => {
            const rawDuration = appt.duration
            let durationLabel = ''
            if (typeof rawDuration === 'number' && rawDuration > 0) {
              durationLabel = `${rawDuration} perc`
            } else if (typeof rawDuration === 'string') {
              const num = parseInt(rawDuration.replace(/[^\d]/g, ''), 10)
              durationLabel = Number.isNaN(num)
                ? rawDuration.replace(/perc/gi, '').trim()
                : `${num} perc`
            }

            const nameCandidates = [
              appt.customer_name,
              appt.customerName,
              [appt.first_name, appt.last_name].filter(Boolean).join(' ').trim(),
              appt.customer?.name,
            ].filter((n) => n && n.trim())
            const displayName = nameCandidates[0] || 'Vendég'

            return (
              <div key={idx} className="glass-card-appointments">
                <div className="appointment-card__top">
                  <div className="appointment-card__service">{appt.service}</div>
                  <span className="appointment-card__time">
                    {formatDateTime(appt.date || appt.booking_date, appt.time)}
                  </span>
                </div>
                <div className="appointment-card__customer">{displayName}</div>
                <div className="appointment-card__duration">{durationLabel}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-white/70 text-center">Nincsenek időpontok</div>
      )}
    </section>
  )
}

export default AppointmentsSection
