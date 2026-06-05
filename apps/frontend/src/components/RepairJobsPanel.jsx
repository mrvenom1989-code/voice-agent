import React, { useEffect, useState, useRef } from 'react';
import { Wrench, Clock, UserCheck, Smartphone } from 'lucide-react';

export function RepairJobsPanel({ dbState }) {
  const [repairJobs, setRepairJobs] = useState([]);
  const [highlightedSlot, setHighlightedSlot] = useState(null); // { date, time, type: 'booked'|'cancelled' }
  const prevRepairJobsRef = useRef([]);

  const defaultSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  // Dynamically generate the next 5 weekdays (excluding Sundays) for repair bookings
  const availableDates = (() => {
    const dates = [];
    const today = new Date();
    let d = new Date(today);
    while (dates.length < 5) {
      if (d.getDay() !== 0) { // Skip Sundays
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
    if (dbState?.repairJobs) {
      const newJobs = dbState.repairJobs;
      const prevJobs = prevRepairJobsRef.current;

      if (prevJobs.length > 0) {
        // Detect newly booked repair jobs
        const added = newJobs.find(
          nJ => !prevJobs.some(pJ => pJ.date === nJ.date && pJ.time === nJ.time)
        );

        // Detect cancelled repair jobs
        const removed = prevJobs.find(
          pJ => !newJobs.some(nJ => nJ.date === pJ.date && nJ.time === pJ.time)
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

      prevRepairJobsRef.current = newJobs;
      setRepairJobs(newJobs);
    }
  }, [dbState]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="glass-card rounded-3xl p-6 glow-blue relative overflow-hidden h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold tracking-wide text-slate-100">Repair Jobs</h2>
        </div>
        
        {/* Date Selector Tabs */}
        <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/40 overflow-x-auto">
          {availableDates.map(date => {
            const label = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedDate === date
                    ? 'bg-blue-600 text-white shadow-md'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
        {defaultSlots.map(time => {
          const job = repairJobs.find(j => j.date === selectedDate && j.time === time);
          const isHighlighted = highlightedSlot?.date === selectedDate && highlightedSlot?.time === time;
          const highlightType = highlightedSlot?.type;

          return (
            <div
              key={time}
              className={`p-3.5 rounded-2xl border transition-all duration-300 relative ${
                job
                  ? `bg-blue-950/15 border-blue-500/25 text-blue-200 ${
                      isHighlighted && highlightType === 'booked'
                        ? 'border-blue-400 bg-blue-900/30 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-double-pulse'
                        : ''
                    }`
                  : `bg-slate-900/40 border-slate-800/40 text-slate-400 ${
                      isHighlighted && highlightType === 'cancelled'
                        ? 'border-rose-500/50 bg-rose-950/20 scale-[1.02] shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-double-pulse'
                        : 'hover:border-slate-750 hover:bg-slate-900/60'
                    }`
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="flex items-center gap-1 text-[11px] font-mono font-semibold tracking-wide">
                  <Clock className="w-3.5 h-3.5" />
                  {time}
                </span>
                {job ? (
                  <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                    job.status === 'Ready for Pickup' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                    job.status === 'In Progress' ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' :
                    'bg-blue-950/40 text-blue-400 border-blue-900/30'
                  }`}>
                    {job.status}
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-950/40 border border-slate-800/40 px-2 py-0.5 rounded text-slate-500">
                    Open
                  </span>
                )}
              </div>

              {job ? (
                <div className="mt-2 text-left">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-100 truncate">{job.device}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono italic mb-1.5">Issue: {job.issue}</p>
                  
                  <div className="border-t border-slate-800/50 pt-1.5 mt-1.5 flex justify-between items-center">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-300">{job.name}</p>
                      <p className="text-[9px] text-slate-500">{job.phone}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/40">
                      ${job.cost}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-left py-1">
                  <p className="text-xs italic text-slate-600">Available for check-in</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
