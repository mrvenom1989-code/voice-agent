import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, UserCheck } from 'lucide-react';

export function CalendarPanel({ dbState }) {
  const [appointments, setAppointments] = useState([]);
  const [highlightedSlot, setHighlightedSlot] = useState(null); // { date, time, type: 'booked'|'cancelled' }
  const prevAppointmentsRef = useRef([]);

  const defaultSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  // Dynamically generate the next 5 weekdays (excluding Sundays) for the calendar
  const availableDates = (() => {
    const dates = [];
    const today = new Date();
    let d = new Date(today);
    while (dates.length < 5) {
      if (d.getDay() !== 0) { // Skip Sundays (clinic closed)
        dates.push(d.toISOString().split('T')[0]);
      }
      d = new Date(d);
      d.setDate(d.getDate() + 1);
    }
    return dates;
  })();
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (dbState?.appointments) {
      const newApps = dbState.appointments;
      const prevApps = prevAppointmentsRef.current;

      if (prevApps.length > 0) {
        // Check for newly added appointments
        const added = newApps.find(
          nA => !prevApps.some(pA => pA.date === nA.date && pA.time === nA.time)
        );

        // Check for removed appointments
        const removed = prevApps.find(
          pA => !newApps.some(nA => nA.date === pA.date && nA.time === pA.time)
        );

        if (added) {
          setHighlightedSlot({ date: added.date, time: added.time, type: 'booked' });
          setSelectedDate(added.date);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setHighlightedSlot(null), 3000);
        } else if (removed) {
          setHighlightedSlot({ date: removed.date, time: removed.time, type: 'cancelled' });
          setSelectedDate(removed.date);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setHighlightedSlot(null), 3000);
        }
      }

      prevAppointmentsRef.current = newApps;
      setAppointments(newApps);
    }
  }, [dbState]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="glass-card rounded-3xl p-6 glow-purple relative overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold tracking-wide text-slate-100">Clinic Appointments</h2>
        </div>
        
        {/* Date Selector Tabs */}
        <div className="flex gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800/40">
          {availableDates.map(date => {
            const label = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  selectedDate === date
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
        {defaultSlots.map(time => {
          const booking = appointments.find(app => app.date === selectedDate && app.time === time);
          const isHighlighted = highlightedSlot?.date === selectedDate && highlightedSlot?.time === time;
          const highlightType = highlightedSlot?.type;

          return (
            <div
              key={time}
              className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                booking
                  ? `bg-purple-950/20 border-purple-500/30 text-purple-200 ${
                      isHighlighted && highlightType === 'booked'
                        ? 'border-purple-400 bg-purple-900/40 scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-double-pulse'
                        : ''
                    }`
                  : `bg-slate-900/40 border-slate-800/40 text-slate-400 ${
                      isHighlighted && highlightType === 'cancelled'
                        ? 'border-rose-500/50 bg-rose-950/20 scale-[1.02] shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-double-pulse'
                        : 'hover:border-slate-700/50 hover:bg-slate-900/60'
                    }`
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                  <Clock className="w-3.5 h-3.5" />
                  {time}
                </span>
                {booking ? (
                  <span className="text-[10px] bg-purple-900/60 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-300 flex items-center gap-1">
                    <UserCheck className="w-2.5 h-2.5" /> Booked
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400">
                    Available
                  </span>
                )}
              </div>

              {booking ? (
                <div className="mt-2 text-left">
                  <p className="text-sm font-semibold text-slate-100 truncate">{booking.name}</p>
                  <p className="text-[11px] text-slate-400">{booking.phone}</p>
                </div>
              ) : (
                <div className="mt-2 text-left">
                  <p className="text-xs italic text-slate-500">No appointment booked</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
