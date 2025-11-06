import React, { useState } from "react";
import dayjs from "dayjs";
import events from "./events.json";
import './Calender.css'

const Calendar = () => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");
  const startDay = monthStart.day();
  const totalDays = monthEnd.date();

  const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  // return events for the given day (dayObj is a dayjs instance)
  const getEventsForDate = (dayObj) => {
    const formatted = dayObj.format("YYYY-MM-DD");
    return events.filter((ev) => ev.date === formatted).map(ev => ({ ...ev }));
  };

  // Parse an event's start/end into dayjs moments (using event.date so same-day comparison)
  const parseEventMoments = (ev) => {
    // Expect ev.startTime and ev.endTime like "09:30" and ev.date like "2025-03-10"
    const start = dayjs(`${ev.date} ${ev.startTime}`, "YYYY-MM-DD HH:mm");
    const end = dayjs(`${ev.date} ${ev.endTime}`, "YYYY-MM-DD HH:mm");
    return { start, end };
  };

  // Detect conflicts properly (including exact same start times)
  const detectConflicts = (eventList) => {
    // clone and attach moments and reset conflict flag
    const updated = eventList.map(ev => {
      const { start, end } = parseEventMoments(ev);
      return { ...ev, startMoment: start, endMoment: end, conflict: false };
    });

    // sort by start time to reduce comparisons (optional but helpful)
    updated.sort((a, b) => a.startMoment.valueOf() - b.startMoment.valueOf());

    for (let i = 0; i < updated.length; i++) {
      const aStart = updated[i].startMoment;
      const aEnd = updated[i].endMoment;

      for (let j = i + 1; j < updated.length; j++) {
        const bStart = updated[j].startMoment;
        const bEnd = updated[j].endMoment;

        // Conditions considered overlap/conflict:
        // 1) intervals overlap strictly: aStart < bEnd && bStart < aEnd
        // 2) exact same start times: aStart.isSame(bStart)
        // 3) exact same end times: aEnd.isSame(bEnd)
        // Note: if you consider end == start as non-conflict, we DO NOT treat that as conflict.
        const intervalsOverlap = aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
        const sameStart = aStart.isSame(bStart);
        const sameEnd = aEnd.isSame(bEnd);

        if (intervalsOverlap || sameStart || sameEnd) {
          updated[i].conflict = true;
          updated[j].conflict = true;
        }
      }
    }

    return updated;
  };

  const days = [];

  // leading empty cells
  for (let empty = 0; empty < startDay; empty++) {
    days.push(<div key={`empty-${empty}`} className="empty"></div>);
  }

  // day cells
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = monthStart.date(d);
    const isToday = dateObj.isSame(today, "day");
    const eventsOfDay = detectConflicts(getEventsForDate(dateObj));

    days.push(
      <div key={d} className={`day ${isToday ? "highlight" : ""}`}>
        <div className="date-number">{d}</div>

        {eventsOfDay.length === 0 ? null : eventsOfDay.map((ev, idx) => (
          <div
            key={idx}
            className={`event ${ev.conflict ? "conflict" : "normal"}`}
            title={`${ev.title} • ${ev.startTime} - ${ev.endTime}`}
          >
            <div className="event-title truncate">{ev.title}</div>
            <div className="event-time text-xs">{ev.startTime} - {ev.endTime}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="header">
        <button onClick={handlePrevMonth} className="nav-btn">◀</button>
        <h2>{currentMonth.format("MMMM YYYY")}</h2>
        <button onClick={handleNextMonth} className="nav-btn">▶</button>
      </div>

      <div className="day-names">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="grid">{days}</div>
    </div>
  );
};

export default Calendar;
