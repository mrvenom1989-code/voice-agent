import React from 'react';
import { 
  PhoneCall, 
  Clock, 
  UserCheck, 
  Activity, 
  Stethoscope, 
  Pill, 
  Wrench, 
  Terminal, 
  AlertCircle, 
  ShieldAlert, 
  ChevronRight, 
  Sparkles,
  PieChart
} from 'lucide-react';

export function UtilizationDashboard({ dbState }) {
  const sessions = dbState?.sessions || [];

  // 1. Calculate General Metrics
  const totalCalls = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'connecting');
  const activeCallsCount = activeSessions.length;
  
  const finishedSessions = sessions.filter(s => s.durationMs !== null);
  const totalDurationMs = finishedSessions.reduce((acc, s) => acc + (s.durationMs || 0), 0);
  const avgDurationMs = finishedSessions.length > 0 ? totalDurationMs / finishedSessions.length : 0;
  
  const escalatedCalls = sessions.filter(s => s.status === 'escalated').length;
  const escalationRate = totalCalls > 0 ? Math.round((escalatedCalls / totalCalls) * 100) : 0;

  // Helper to format duration
  const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return '0s';
    const totalSecs = Math.round(ms / 1000);
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Helper to format timestamps
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  };

  // 2. Calculate Agent Breakdowns
  const getAgentMetrics = (agentId) => {
    const agentSess = sessions.filter(s => s.agentId === agentId);
    const completed = agentSess.filter(s => s.status === 'completed' || s.status === 'active').length;
    const escalated = agentSess.filter(s => s.status === 'escalated').length;
    const duration = agentSess.reduce((acc, s) => acc + (s.durationMs || 0), 0);
    return {
      count: agentSess.length,
      duration,
      escalated,
      completed
    };
  };

  const clinicMetrics = getAgentMetrics('clinic');
  const pharmacyMetrics = getAgentMetrics('pharmacy');
  const mobileKlinikMetrics = getAgentMetrics('mobile_klinik');

  const maxCalls = Math.max(clinicMetrics.count, pharmacyMetrics.count, mobileKlinikMetrics.count, 1);

  // 3. Calculate Tool Frequency
  const toolCounts = {};
  sessions.forEach(s => {
    (s.toolCalls || []).forEach(tc => {
      toolCounts[tc.name] = (toolCounts[tc.name] || 0) + 1;
    });
  });

  const toolStats = Object.entries(toolCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxToolCount = Math.max(...toolStats.map(t => t.count), 1);

  // Status Badge UI configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)] animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Live Call
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-semibold px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
            Connecting
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-950/30 border border-emerald-500/20">
            Completed
          </span>
        );
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 px-2 py-0.5 rounded-md bg-purple-950/30 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.1)]">
            Escalated to Human
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
            Inactivity Timeout
          </span>
        );
      case 'timeout':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
            Max Duration Limit
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 px-2 py-0.5 rounded-md bg-rose-950/30 border border-rose-500/20">
            Failed / Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-900">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* Active Call Alert banner */}
      {activeCallsCount > 0 && (
        <div className="bg-gradient-to-r from-green-950/30 to-slate-900/50 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_25px_rgba(34,197,94,0.05)]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-200">Live Connection Active</p>
              <p className="text-xs text-slate-400">
                {activeSessions.map((s, idx) => (
                  <span key={s.id}>
                    {idx > 0 && ', '}
                    Agent <span className="text-green-400 font-mono font-bold">{s.agentName}</span> is currently processing user speech.
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-950/40 px-3 py-1 rounded-xl border border-green-800/30 text-xs font-mono text-green-300">
            <Activity className="w-4 h-4 animate-spin-slow text-green-400" />
            <span>Streaming...</span>
          </div>
        </div>
      )}

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Calls */}
        <div className="glass-card rounded-2xl p-5 border border-slate-900 glow-indigo relative overflow-hidden flex flex-col justify-between h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Connections</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <PhoneCall className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight text-slate-100">{totalCalls}</h4>
            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Cumulative audio sessions</span>
          </div>
        </div>

        {/* Live / Active Sessions */}
        <div className="glass-card rounded-2xl p-5 border border-slate-900 glow-emerald relative overflow-hidden flex flex-col justify-between h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Lines</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h4 className={`text-2xl font-black font-mono tracking-tight ${activeCallsCount > 0 ? 'text-green-400 animate-pulse' : 'text-slate-100'}`}>
              {activeCallsCount}
            </h4>
            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Real-time active streams</span>
          </div>
        </div>

        {/* Average Duration */}
        <div className="glass-card rounded-2xl p-5 border border-slate-900 glow-purple relative overflow-hidden flex flex-col justify-between h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Session Length</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight text-slate-100">
              {formatDuration(avgDurationMs)}
            </h4>
            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">Total duration: {formatDuration(totalDurationMs)}</span>
          </div>
        </div>

        {/* Human Handoff Rate */}
        <div className="glass-card rounded-2xl p-5 border border-slate-900 glow-blue relative overflow-hidden flex flex-col justify-between h-[115px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Escalation Rate</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black font-mono tracking-tight text-slate-100">{escalationRate}%</h4>
            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{escalatedCalls} of {totalCalls} calls escalated</span>
          </div>
        </div>

      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Agent Utilization Breakdown (lg:col-span-7) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-slate-900/60 overflow-hidden flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                Utilization By Receptionist Agent
              </h3>
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest uppercase">Usage metrics</span>
            </div>

            <div className="space-y-6">
              
              {/* Clara (Clinic) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Stethoscope className="w-4 h-4" />
                    <span>Clara (Clinic Desk)</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-slate-100">{clinicMetrics.count}</strong> calls &middot; {formatDuration(clinicMetrics.duration)}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900/80">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                    style={{ width: `${(clinicMetrics.count / maxCalls) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Handoff rate: {clinicMetrics.count > 0 ? Math.round((clinicMetrics.escalated / clinicMetrics.count) * 100) : 0}%</span>
                  <span>Avg: {clinicMetrics.count > 0 ? formatDuration(clinicMetrics.duration / clinicMetrics.count) : '0s'}</span>
                </div>
              </div>

              {/* Phoebe (Pharmacy) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Pill className="w-4 h-4" />
                    <span>Phoebe (Pharmacy Stock)</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-slate-100">{pharmacyMetrics.count}</strong> calls &middot; {formatDuration(pharmacyMetrics.duration)}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900/80">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    style={{ width: `${(pharmacyMetrics.count / maxCalls) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Handoff rate: {pharmacyMetrics.count > 0 ? Math.round((pharmacyMetrics.escalated / pharmacyMetrics.count) * 100) : 0}%</span>
                  <span>Avg: {pharmacyMetrics.count > 0 ? formatDuration(pharmacyMetrics.duration / pharmacyMetrics.count) : '0s'}</span>
                </div>
              </div>

              {/* Ryder (Mobile Klinik) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Wrench className="w-4 h-4" />
                    <span>Ryder (Mobile Repair)</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    <strong className="text-slate-100">{mobileKlinikMetrics.count}</strong> calls &middot; {formatDuration(mobileKlinikMetrics.duration)}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-900/80">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                    style={{ width: `${(mobileKlinikMetrics.count / maxCalls) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Handoff rate: {mobileKlinikMetrics.count > 0 ? Math.round((mobileKlinikMetrics.escalated / mobileKlinikMetrics.count) * 100) : 0}%</span>
                  <span>Avg: {mobileKlinikMetrics.count > 0 ? formatDuration(mobileKlinikMetrics.duration / mobileKlinikMetrics.count) : '0s'}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-900 text-xs text-slate-400 font-sans flex items-start gap-2.5 leading-normal mt-6">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Usage metrics help determine patient load, receptionist routing efficiency, and inventory lookup frequency across all channels.
            </p>
          </div>
        </div>

        {/* Tool Call Frequency (lg:col-span-5) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Active Tool Frequency
              </h3>
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest uppercase">Function Calls</span>
            </div>

            {toolStats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs italic flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-700" />
                No tool calls logged yet. Voice agents will populate this data when they execute database actions.
              </div>
            ) : (
              <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {toolStats.map((tool, idx) => (
                  <div key={tool.name} className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-200">{tool.name}()</span>
                      <span className="font-mono font-bold text-indigo-400">{tool.count} times</span>
                    </div>
                    <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-900/30">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(tool.count / maxToolCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/10 rounded-2xl border border-indigo-900/20 text-[11px] text-slate-400 font-mono text-center leading-normal mt-4">
            Total operations performed by LLM: <strong className="text-indigo-300">{Object.values(toolCounts).reduce((a, b) => a + b, 0)}</strong>
          </div>
        </div>

      </div>

      {/* Connection Session Log (Full width) */}
      <div className="glass-card rounded-3xl p-6 border border-slate-900/60">
        <div className="flex items-center justify-between mb-6 border-b border-slate-900 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Session Connection History
          </h3>
          <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
            Total sessions logged: {totalCalls}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs italic flex flex-col items-center gap-2">
            <PhoneCall className="w-8 h-8 text-slate-700 animate-pulse-slow" />
            No audio call history logged. Once you establish a voice connection, it will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Executed Operations (Tools)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-slate-300 font-sans">
                {[...sessions].reverse().slice(0, 15).map((session) => {
                  const hasTools = session.toolCalls && session.toolCalls.length > 0;
                  
                  let AgentIcon = Stethoscope;
                  let agentColor = 'text-purple-400';
                  if (session.agentId === 'pharmacy') {
                    AgentIcon = Pill;
                    agentColor = 'text-emerald-400';
                  } else if (session.agentId === 'mobile_klinik') {
                    AgentIcon = Wrench;
                    agentColor = 'text-blue-400';
                  }

                  return (
                    <tr 
                      key={session.id} 
                      className={`hover:bg-slate-900/20 transition-all duration-150 ${
                        session.status === 'active' ? 'bg-green-950/5' : ''
                      }`}
                    >
                      {/* Agent */}
                      <td className="py-3.5 px-4 font-bold flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg bg-slate-950 border border-slate-900 ${agentColor}`}>
                          <AgentIcon className="w-4 h-4" />
                        </div>
                        <span>{session.agentName}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(session.status)}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {formatDate(session.startTime)} &middot; {formatTime(session.startTime)}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {session.status === 'active' || session.status === 'connecting' 
                          ? '-' 
                          : formatDuration(session.durationMs)}
                      </td>

                      {/* Tools Used */}
                      <td className="py-3.5 px-4">
                        {hasTools ? (
                          <div className="flex flex-wrap gap-1.5">
                            {session.toolCalls.map((tc, tcIdx) => (
                              <span 
                                key={tcIdx}
                                className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded"
                                title={formatTime(tc.timestamp)}
                              >
                                {tc.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-[10px] italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sessions.length > 15 && (
              <div className="py-3 text-center text-slate-500 font-mono text-[10px] border-t border-slate-900/40">
                Displaying the latest 15 sessions. Open db.json to view all.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
