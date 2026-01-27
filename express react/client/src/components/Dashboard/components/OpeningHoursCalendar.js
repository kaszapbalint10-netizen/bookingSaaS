import React, { useEffect, useMemo, useState, useCallback } from "react"
import axios from "../utils/axiosConfig"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameDay } from "date-fns"
import "../css/OpeningHours.css"

const dayNamesHu = ["H", "K", "Sz", "Cs", "P", "Sz", "V"]
const dayLabelsHu = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]
const STORAGE_KEY = "oh-daymap"
const DEFAULT_LOCATION = "Főszalon"

const OpeningHoursCalendar = ({ openingHours }) => {
  const today = new Date()
  const todayIndex = (today.getDay() + 6) % 7 // Monday = 0

  const [selectedDate, setSelectedDate] = useState(null)
  const [dayMap, setDayMap] = useState({})
  const [openTime, setOpenTime] = useState("09:00")
  const [closeTime, setCloseTime] = useState("18:00")
  const [hasBreak, setHasBreak] = useState(false)
  const [breakStart, setBreakStart] = useState("12:00")
  const [breakEnd, setBreakEnd] = useState("13:00")
  const [pickerField, setPickerField] = useState(null)
  const [pickerHour, setPickerHour] = useState("09")
  const [pickerMinute, setPickerMinute] = useState("00")

  const safeOpeningHours = useMemo(
    () => (Array.isArray(openingHours) ? openingHours : []),
    [openingHours && openingHours.length]
  )

  const normalized = safeOpeningHours.length
    ? safeOpeningHours
    : dayLabelsHu.map((day, idx) => ({
        day,
        open_time: "09:00",
        close_time: idx === 6 ? "14:00" : "18:00",
        break_start: "",
        break_end: "",
      }))

  const thisMonthDays = useMemo(() => {
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    return eachDayOfInterval({ start, end })
  }, [today])

  const firstDayOffset = ((getDay(startOfMonth(today)) + 6) % 7) || 0

  const fallbackWeekHours = useMemo(() => {
    const map = {}
    dayLabelsHu.forEach((d, idx) => {
      map[idx] =
        normalized[idx] || {
          day: d,
          open_time: "09:00",
          close_time: idx === 6 ? "14:00" : "18:00",
          break_start: "",
          break_end: "",
        }
    })
    return map
  }, [normalized])

  const syncFormFromDate = (date) => {
    const key = format(date, "yyyy-MM-dd")
    const weekdayIdx = (getDay(date) + 6) % 7
    const base = dayMap[key] || fallbackWeekHours[weekdayIdx] || {}
    setSelectedDate(key)
    setOpenTime(base.open_time || "09:00")
    setCloseTime(base.close_time || "18:00")
    const hasBr = Boolean(base.break_start && base.break_end)
    setHasBreak(hasBr)
    setBreakStart(base.break_start || "12:00")
    setBreakEnd(base.break_end || "13:00")
  }

  useEffect(() => {
    const mapped = {}
    if (safeOpeningHours && safeOpeningHours.length) {
      safeOpeningHours.forEach((slot) => {
        const key = slot.date
        mapped[key] = {
          open_time: slot.start_time || slot.open_time,
          close_time: slot.end_time || slot.close_time,
          break_start: slot.break_start || "",
          break_end: slot.break_end || "",
        }
      })
    }

    let merged = { ...mapped }
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      if (stored && typeof stored === "object") {
        merged = { ...merged, ...stored }
      }
    } catch (_err) {
      // ignore parse errors
    }
    setDayMap(merged)
  }, [safeOpeningHours])

  const persistDayMap = (nextMap) => {
    setDayMap(nextMap)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap))
    } catch (_err) {
      // ignore storage errors
    }
  }

  const handleSave = async () => {
    const next = {
      open_time: openTime,
      close_time: closeTime,
      break_start: hasBreak ? breakStart : "",
      break_end: hasBreak ? breakEnd : "",
    }
    persistDayMap({
      ...dayMap,
      [selectedDate]: next,
    })

    try {
      const timeSlots = [
        {
          date: selectedDate,
          time_slot_type: "OPEN",
          start_time: openTime,
          end_time: closeTime,
          location: DEFAULT_LOCATION,
        },
      ]
      if (hasBreak) {
        timeSlots.push({
          date: selectedDate,
          time_slot_type: "BREAK",
          start_time: breakStart,
          end_time: breakEnd,
          location: DEFAULT_LOCATION,
        })
      }

      await axios.post("/api/dashboard/opening-hours", {
        date: selectedDate,
        timeSlots,
      })
      console.log("Opening hours saved", { date: selectedDate, timeSlots })
    } catch (error) {
      console.error("Opening hours save failed", error)
      alert("Nem sikerült menteni a nyitvatartást. Próbáld újra.")
    }
    setSelectedDate(null)
  }

  const currentSelection = useMemo(() => {
    if (!selectedDate) return {}
    const dateObj = new Date(selectedDate)
    const weekdayIdx = (getDay(dateObj) + 6) % 7
    return dayMap[selectedDate] || fallbackWeekHours[weekdayIdx] || {}
  }, [dayMap, fallbackWeekHours, selectedDate])

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")), [])
  const minuteOptions = useMemo(() => ["00", "15", "30", "45"], [])

  const handleSelectTime = useCallback((field, value) => {
    if (field === "open") setOpenTime(value)
    if (field === "close") setCloseTime(value)
    if (field === "breakStart") setBreakStart(value)
    if (field === "breakEnd") setBreakEnd(value)
    setPickerField(null)
  }, [])

  const togglePicker = (field) => {
    setPickerField((prev) => {
      if (prev === field) return null
      const current =
        field === "open"
          ? openTime
          : field === "close"
            ? closeTime
            : field === "breakStart"
              ? breakStart
              : breakEnd
      const [h = "00", m = "00"] = (current || "00:00").split(":")
      setPickerHour(h.padStart(2, "0"))
      setPickerMinute(m.padStart(2, "0"))
      return field
    })
  }

  const confirmPicker = (field) => {
    handleSelectTime(field, `${pickerHour}:${pickerMinute}`)
  }

  const updateTempTime = (field, { hour, minute }) => {
    const current =
      field === "open"
        ? openTime
        : field === "close"
          ? closeTime
          : field === "breakStart"
            ? breakStart
            : breakEnd
    const [h = "00", m = "00"] = (current || "00:00").split(":")
    const nextHour = hour || h
    const nextMinute = minute || m
    setPickerHour(nextHour.padStart(2, "0"))
    setPickerMinute(nextMinute.padStart(2, "0"))
  }

  const renderPicker = (field) => (
    <div className="oh-time-picker">
      <div className="oh-time-columns">
        <div className="oh-time-column">
          {hourOptions.map((h) => (
            <button
              key={h}
              type="button"
              className={pickerHour === h ? "is-active" : ""}
              onClick={() => updateTempTime(field, { hour: h })}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="oh-time-column">
          {minuteOptions.map((m) => (
            <button
              key={m}
              type="button"
              className={pickerMinute === m ? "is-active" : ""}
              onClick={() => updateTempTime(field, { minute: m })}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="oh-picker-actions">
        <button type="button" className="oh-ghost" onClick={() => setPickerField(null)}>
          Mégse
        </button>
        <button type="button" className="oh-cta" onClick={() => confirmPicker(field)}>
          OK
        </button>
      </div>
    </div>
  )

  return (
    <section className="opening-hours-calendar">
      <div className="oh-header">
        <div>
          <h3 className="oh-title">Heti nyitvatartás</h3>
          <p className="oh-sub">Kattints egy napra a módosításhoz</p>
        </div>
      </div>

      <div className="oh-calendar">
        <div className="oh-weekdays">
          {dayNamesHu.map((name, idx) => (
            <span key={`${name}-${idx}`}>{name}</span>
          ))}
        </div>

        <div className="oh-grid">
          {Array.from({ length: firstDayOffset }).map((_, idx) => (
            <span key={`empty-${idx}`} className="oh-day empty" />
          ))}
          {thisMonthDays.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const hours = dayMap[key]
            const isSelected = selectedDate && isSameDay(new Date(selectedDate), day)
            const isToday = isSameDay(today, day)
            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => syncFormFromDate(day)}
                className={`oh-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
              >
                <span className="oh-day-number">{format(day, "d")}</span>
                <span className="oh-day-hours">
                  {hours?.open_time} - {hours?.close_time}
                </span>
                {hours?.break_start && hours?.break_end && (
                  <span className="oh-day-break">
                    Ebéd: {hours.break_start} - {hours.break_end}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="oh-overlay">
          <div className="oh-modal">
            <div className="oh-form-head">
              <div>
                <p className="oh-eyebrow">Dátum</p>
                <h3 className="oh-subtitle">{format(new Date(selectedDate), "yyyy. MMM dd.")}</h3>
              </div>
              <div className="oh-modal-actions">
                <button onClick={() => setSelectedDate(null)} className="oh-ghost">
                  Mégse
                </button>
                <button onClick={handleSave} className="oh-cta">
                  Mentés
                </button>
              </div>
            </div>

            <div className="oh-grid-2">
              <div className="oh-field oh-time-field">
                <label>Nyitás</label>
                <input type="text" value={openTime} readOnly onClick={() => togglePicker("open")} />
                {pickerField === "open" && renderPicker("open")}
              </div>
              <div className="oh-field oh-time-field">
                <label>Zárás</label>
                <input type="text" value={closeTime} readOnly onClick={() => togglePicker("close")} />
                {pickerField === "close" && renderPicker("close")}
              </div>
            </div>

            <div className="oh-break">
              <label className="oh-check">
                <input type="checkbox" checked={hasBreak} onChange={(e) => setHasBreak(e.target.checked)} />
                Szünet
              </label>

              {hasBreak && (
                <div className="oh-grid-2">
                  <div className="oh-field oh-time-field">
                    <label>Kezdete</label>
                    <input
                      type="text"
                      value={breakStart}
                      readOnly
                      onClick={() => togglePicker("breakStart")}
                    />
                    {pickerField === "breakStart" && renderPicker("breakStart")}
                  </div>
                  <div className="oh-field oh-time-field">
                    <label>Vége</label>
                    <input type="text" value={breakEnd} readOnly onClick={() => togglePicker("breakEnd")} />
                    {pickerField === "breakEnd" && renderPicker("breakEnd")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default OpeningHoursCalendar
