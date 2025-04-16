import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import "./EventCalendar.css";

export default function EventCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const mockEvents = [
      { id: "1", title: "Financial Review", date: "2025-03-15", color: "#4f46e5" },
      { id: "2", title: "Budget Planning", date: "2025-03-20", color: "#0ea5e9" },
      { id: "3", title: "Team Meeting", date: "2025-03-28", color: "#10b981" },
    ];
    setEvents(mockEvents);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const addEvent = () => {
    if (newEvent.trim() !== "" && selectedDate) {
      const newEventObj = {
        id: Date.now().toString(),
        title: newEvent,
        date: format(selectedDate, "yyyy-MM-dd"),
        color: getRandomColor(),
      };
      setEvents([...events, newEventObj]);
      setNewEvent("");
    }
  };

  const getRandomColor = () => {
    const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => isSameDay(parseISO(event.date), date));
  };

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <h2 className="calendar-title">Event Calendar</h2>
        <p className="calendar-description">Schedule and track important events</p>
        <div className="calendar-nav">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>←</button>
          <div className="calendar-month">{format(currentDate, "MMMM yyyy")}</div>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>→</button>
        </div>
      </div>
      <div className="calendar-content">
        <div className="calendar-days">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {dateRange.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={date.toString()}
                className={`calendar-cell ${isSameMonth(date, currentDate) ? "" : "other-month"} ${selectedDate && isSameDay(date, selectedDate) ? "selected" : ""} ${isSameDay(date, new Date()) ? "today" : ""}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="calendar-date">{format(date, "d")}</div>
                <div className="calendar-events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="calendar-event" style={{ backgroundColor: event.color }}>{event.title}</div>
                  ))}
                  {dayEvents.length > 2 && <div className="calendar-more-events">+{dayEvents.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="calendar-footer">
        <div className="event-form">
          <input
            type="text"
            placeholder={selectedDate ? `Add event on ${format(selectedDate, "MMM dd")}` : "Select a date first"}
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            disabled={!selectedDate}
          />
          <button onClick={addEvent} disabled={!selectedDate || newEvent.trim() === ""}>+</button>
        </div>
        {selectedDate && getEventsForDate(selectedDate).length > 0 && (
          <div className="selected-date-events">
            <div className="selected-date">{format(selectedDate, "MMMM d, yyyy")}</div>
            <div className="event-list">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-color" style={{ backgroundColor: event.color }}></div>
                  <span className="event-title">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
