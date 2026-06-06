import React, { useEffect, useState } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { VoiceAssistant } from './components/VoiceAssistant';
import { CalendarPanel } from './components/CalendarPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { RepairJobsPanel } from './components/RepairJobsPanel';
import { PartsServicesPanel } from './components/PartsServicesPanel';
import { TranscriptPanel } from './components/TranscriptPanel';
import { UtilizationDashboard } from './components/UtilizationDashboard';
import { Stethoscope, Clock, MapPin, Wrench, Shield, Info, Pill, Smartphone, Sparkles, Globe } from 'lucide-react';

const AGENTS = [
  {
    id: 'clinic',
    name: 'Clara (Clinic)',
    role: 'Clinic Receptionist',
    icon: Stethoscope,
    color: 'purple',
    themeClass: 'from-purple-900/10 to-indigo-900/10',
    borderColor: 'border-purple-500/20',
    glowColor: 'glow-purple',
    brandColor: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
    hoverBorder: 'hover:border-purple-500/30 hover:bg-purple-950/10',
    accentText: 'text-purple-400',
    bgGlow: 'bg-purple-900/10',
    description: 'Book doctor appointments, view schedules & hours'
  },
  {
    id: 'pharmacy',
    name: 'Phoebe (Pharmacy)',
    role: 'Pharmacy Assistant',
    icon: Pill,
    color: 'emerald',
    themeClass: 'from-emerald-900/10 to-teal-900/10',
    borderColor: 'border-emerald-500/20',
    glowColor: 'glow-emerald',
    brandColor: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
    hoverBorder: 'hover:border-emerald-500/30 hover:bg-emerald-950/10',
    accentText: 'text-emerald-400',
    bgGlow: 'bg-emerald-900/10',
    description: 'Lookup medicine stock levels & reserve pickup meds'
  },
  {
    id: 'mobile_klinik',
    name: 'Ryder (Repair)',
    role: 'Mobile Repair Receptionist',
    icon: Wrench,
    color: 'blue',
    themeClass: 'from-blue-900/10 to-cyan-900/10',
    borderColor: 'border-blue-500/20',
    glowColor: 'glow-blue',
    brandColor: 'bg-gradient-to-tr from-blue-600 to-cyan-500',
    hoverBorder: 'hover:border-blue-500/30 hover:bg-blue-950/10',
    accentText: 'text-blue-400',
    bgGlow: 'bg-blue-900/10',
    description: 'Schedule check-in, check repair pricing & order status'
  },
  {
    id: 'multilingual',
    name: 'Aria (Multilingual)',
    role: 'Facility Coordinator',
    icon: Globe,
    color: 'indigo',
    themeClass: 'from-indigo-900/10 to-blue-900/10',
    borderColor: 'border-indigo-500/20',
    glowColor: 'glow-indigo',
    brandColor: 'bg-gradient-to-tr from-indigo-600 to-blue-500',
    hoverBorder: 'hover:border-indigo-500/30 hover:bg-indigo-950/10',
    accentText: 'text-indigo-400',
    bgGlow: 'bg-indigo-900/10',
    description: 'Answers FAQs in English, Hindi & Gujarati'
  }
];

function App() {
  const {
    status,
    errorMessage,
    transcript,
    activeTool,
    dbState: liveDbState,
    isMuted,
    inputVolume,
    isSpeaking,
    toggleMute,
    connect,
    disconnect
  } = useGeminiLive();

  const [initialDbState, setInitialDbState] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('clinic');
  const [activeTab, setActiveTab] = useState('workspaces'); // 'workspaces' or 'dashboard'

  // Fetch initial database state on page load
  useEffect(() => {
    const backendHttpUrl = import.meta.env.VITE_BACKEND_HTTP_URL || 'http://localhost:5000';
    fetch(`${backendHttpUrl}/api/db`)
      .then(res => res.json())
      .then(data => setInitialDbState(data))
      .catch(err => console.error('Failed to load initial DB state:', err));
  }, []);

  // Poll database updates when socket connection is not active
  useEffect(() => {
    let interval = null;
    if (status !== 'connected') {
      const backendHttpUrl = import.meta.env.VITE_BACKEND_HTTP_URL || 'http://localhost:5000';
      interval = setInterval(() => {
        fetch(`${backendHttpUrl}/api/db`)
          .then(res => res.json())
          .then(data => setInitialDbState(data))
          .catch(err => console.error('Failed to poll DB state:', err));
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const dbState = liveDbState || initialDbState;
  const activeAgentInfo = AGENTS.find(a => a.id === selectedAgent) || AGENTS[0];

  const handleAgentSelect = (agentId) => {
    if (selectedAgent === agentId) return;
    // Disconnect active socket session before switching agent
    disconnect();
    setSelectedAgent(agentId);
  };

  // Render tool execution banner
  const renderToolBanner = () => {
    if (!activeTool) return null;

    const { name, args, status: toolStatus } = activeTool;
    let message = '';
    
    if (name === 'check_stock') {
      message = `Checking stock for medication: "${args.medicine_name}"...`;
    } else if (name === 'reserve_medicine') {
      message = `Reserving ${args.quantity} units of "${args.medicine_name}" for patient ${args.patient_name}...`;
    } else if (name === 'get_available_slots') {
      message = `Querying available clinic slots for date: ${args.date}...`;
    } else if (name === 'book_appointment') {
      message = `Booking clinic appointment for ${args.name} at ${args.time} on ${args.date}...`;
    } else if (name === 'cancel_appointment') {
      message = `Cancelling clinic appointment for ${args.name} at ${args.time} on ${args.date}...`;
    } else if (name === 'handoff_to_human') {
      message = `Transferring caller to human technician/receptionist. Reason: "${args.reason}"`;
    } else if (name === 'doctor_availability') {
      message = `Checking availability for doctor: "${args.doctor_name || 'All'}"...`;
    } else if (name === 'get_available_repair_slots') {
      message = `Querying available repair slots for date: ${args.date}...`;
    } else if (name === 'book_repair_job') {
      message = `Booking repair job for ${args.name}'s ${args.device} at ${args.time} on ${args.date}...`;
    } else if (name === 'check_repair_status') {
      message = `Checking repair status for ticket/phone: "${args.phone_or_name}"...`;
    } else if (name === 'check_parts_inventory') {
      message = `Checking parts stock: "${args.device}" - "${args.part}"...`;
    } else if (name === 'get_repair_price') {
      message = `Fetching repair cost: "${args.device}" - "${args.issue}"...`;
    } else if (name === 'get_facility_info') {
      message = `Querying facility details for: "${args.facility || 'all'}"...`;
    } else {
      message = `Executing assistant tool: ${name}...`;
    }

    return (
      <div className={`w-full bg-slate-900/40 border ${activeAgentInfo.borderColor} rounded-2xl p-4 flex items-center justify-between mb-6 shadow-[0_4px_20px_rgba(255,255,255,0.02)] animate-pulse`}>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              selectedAgent === 'clinic' ? 'bg-purple-400' :
              selectedAgent === 'pharmacy' ? 'bg-emerald-400' :
              selectedAgent === 'multilingual' ? 'bg-indigo-400' :
              'bg-blue-400'
            } opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              selectedAgent === 'clinic' ? 'bg-purple-500' :
              selectedAgent === 'pharmacy' ? 'bg-emerald-500' :
              selectedAgent === 'multilingual' ? 'bg-indigo-500' :
              'bg-blue-500'
            }`}></span>
          </span>
          <span className="text-sm font-medium text-slate-200 font-mono">{message}</span>
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-955 text-slate-300 border ${activeAgentInfo.borderColor}`}>
          {toolStatus === 'calling' ? 'Executing' : 'Completed'}
        </span>
      </div>
    );
  };

  const renderDataPanels = () => {
    if (selectedAgent === 'clinic') {
      return (
        <>
          <div className="h-full min-h-0">
            <CalendarPanel dbState={dbState} />
          </div>
          <div className="h-full min-h-0 bg-slate-900/40 rounded-3xl p-6 border border-slate-900/60 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">Doctor Schedules</h3>
            <div className="space-y-3">
              {dbState?.doctors?.map((doc, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-900 text-left">
                  <p className="text-sm font-semibold text-slate-100">{doc.name}</p>
                  <p className="text-xs text-purple-400 font-mono mt-0.5">{doc.specialty}</p>
                  <p className="text-xs text-slate-400 mt-2 font-mono">{doc.hours}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    } else if (selectedAgent === 'pharmacy') {
      return (
        <>
          <div className="h-full min-h-0">
            <InventoryPanel dbState={dbState} activeTool={activeTool} />
          </div>
          <div className="h-full min-h-0 bg-slate-900/40 rounded-3xl p-6 border border-slate-900/60 flex flex-col justify-between text-left">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">Pharmacy Rules</h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-rose-950/20 border border-rose-900/20 rounded-xl">
                  <p className="font-semibold text-rose-300 mb-0.5">Prescription Medications (Rx)</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">Requires a valid medical prescription from a licensed doctor. Phoebe will prompt for validation.</p>
                </div>
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/20 rounded-xl">
                  <p className="font-semibold text-emerald-300 mb-0.5">Over-the-Counter (OTC)</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">No prescription required. Customers can reserve for immediate standard pickup.</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 text-xs text-slate-500 font-mono mt-4 leading-normal">
              <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">Testing Tip</span>
              Try saying: <span className="text-emerald-400">"Is Crocin in stock?"</span> or <span className="text-emerald-400">"Reserve 3 Paracetamol for Alice."</span>
            </div>
          </div>
        </>
      );
    } else if (selectedAgent === 'mobile_klinik') {
      return (
        <>
          <div className="h-full min-h-0">
            <RepairJobsPanel dbState={dbState} />
          </div>
          <div className="h-full min-h-0">
            <PartsServicesPanel dbState={dbState} activeTool={activeTool} />
          </div>
        </>
      );
    } else if (selectedAgent === 'multilingual') {
      return (
        <>
          {/* Facility Hours & Locations */}
          <div className="h-full min-h-0 bg-slate-900/40 rounded-3xl p-6 border border-slate-900/60 overflow-y-auto custom-scrollbar flex flex-col justify-between text-left">
            <div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Hospital Profile</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900">
                  <p className="text-sm font-bold text-slate-100">RUDRA AYURVED</p>
                  <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mt-0.5">Multi - Speciality Panchkarma Hospital</p>
                  
                  <div className="mt-4 text-xs text-slate-300 space-y-2.5">
                    <p><span className="text-slate-500 font-mono block text-[10px] uppercase font-bold mb-0.5">Location</span>206, B-Block, 2nd Floor, Olive Greens, Gota, S.G. Highway, Ahmedabad - 382481</p>
                    <p><span className="text-slate-500 font-mono block text-[10px] uppercase font-bold mb-0.5">Hours</span>Mon-Sat: 10:00 AM - 7:00 PM<br />Sun: 10:00 AM - 2:00 PM</p>
                    <p><span className="text-slate-500 font-mono block text-[10px] uppercase font-bold mb-0.5">Contact</span>+91 63521 35799 | rudraayurved5@gmail.com</p>
                    <p><span className="text-slate-500 font-mono block text-[10px] uppercase font-bold mb-0.5">Specialists</span>
                      <strong className="text-slate-200">Dr. Chirag Raval</strong> (B.A.M.S, CCPT Kerala) - Expert in Pulse Diagnosis (Nadi Pariksha) & Panchakarma therapies for chronic lifestyle disorders.<br />
                      <strong className="text-slate-200 mt-1 block">Dr. Dipal Raval</strong> (B.H.M.S, P.G.D.C.C, P.G.D.C.T) - Specialist in Hair Repair, Skin Rejuvenation & advanced Clinical Cosmetology.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-indigo-950/10 border border-indigo-900/20 rounded-2xl text-xs text-slate-400 font-mono mt-4 leading-normal">
              <span className="text-[10px] text-indigo-400 block uppercase font-bold mb-1">Grounding Note</span>
              Aria answers queries about services, hours, locations, and doctors dynamically.
            </div>
          </div>

          {/* Multilingual Interaction Panel */}
          <div className="h-full min-h-0 bg-slate-900/40 rounded-3xl p-6 border border-slate-900/60 overflow-y-auto custom-scrollbar text-left flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Multilingual Testing Guide</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">English (EN)</span>
                  <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-900 text-xs text-slate-300 italic">
                    "Where is Rudra Ayurved located?" or "Who are the specialists at the hospital?"
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Hindi (HI) / हिंदी</span>
                  <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-900 text-xs text-slate-300 italic">
                    "नमस्ते आरिया, रुद्र आयुर्वेद अस्पताल का पता क्या है?"
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Gujarati (GU) / ગુજરાતી</span>
                  <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-900 text-xs text-slate-300 italic">
                    "નમસ્તે આરિયા, રુદ્ર આયુર્વેદના ડોક્ટરો કોણ છે?"
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 text-xs text-slate-500 font-mono mt-4 leading-normal">
              <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">Pro Tip</span>
              Aria will reply automatically using correct accents for Hindi and Gujarati!
            </div>
          </div>
        </>
      );
    }
  };

  // Active details
  const displayHours = selectedAgent === 'mobile_klinik' ? 'Mon-Sat: 10 AM-7 PM, Sun: 12-5 PM' : selectedAgent === 'multilingual' ? 'Mon-Sat: 10 AM-7 PM, Sun: 10 AM-2 PM' : 'Weekdays: 8 AM - 6 PM';
  const displayLocation = selectedAgent === 'mobile_klinik' ? '456 Tech Boulevard' : selectedAgent === 'multilingual' ? 'Ahmedabad, Gujarat' : '123 Healing Way';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Background Gradients */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full ${activeAgentInfo.bgGlow} blur-[100px] pointer-events-none transition-all duration-1000`} />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] rounded-full bg-slate-900/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3 text-left">
            <div className={`w-10 h-10 rounded-2xl ${activeAgentInfo.brandColor} flex items-center justify-center shadow-lg transition-all duration-1000`}>
              {React.createElement(activeAgentInfo.icon, { className: "w-5.5 h-5.5 text-white" })}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300">
                Multi-Agent Front Desk
              </h1>
              <p className={`text-[11px] font-semibold tracking-widest uppercase ${activeAgentInfo.accentText} transition-all duration-500`}>
                Simulated AI Telephony Portal
              </p>
            </div>
          </div>

          {/* Meta Info Cards */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/40 px-3 py-2 rounded-xl">
              <Clock className={`w-4 h-4 ${activeAgentInfo.accentText}`} />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Hours</span>
                <span>{displayHours}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/40 px-3 py-2 rounded-xl">
              <MapPin className={`w-4 h-4 ${activeAgentInfo.accentText}`} />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Location</span>
                <span>{displayLocation}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/40 px-3 py-2 rounded-xl">
              <Shield className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Modality</span>
                <span>Gemini Live Voice</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-slate-900 rounded-2xl self-start mb-6 font-medium text-xs">
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === 'workspaces'
                ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-100 font-bold border-slate-700 shadow-sm shadow-black/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agent Workspaces
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-slate-100 font-bold border-indigo-500 shadow-md shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Utilization Dashboard
          </button>
        </div>

        {activeTab === 'workspaces' ? (
          <>
            {/* Agent Cards Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fadeIn">
              {AGENTS.map((agent) => {
                const IconComponent = agent.icon;
                const isSelected = selectedAgent === agent.id;
                
                let cardClass = '';
                if (isSelected) {
                  if (agent.id === 'clinic') cardClass = 'border-purple-500/80 bg-purple-950/15 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
                  else if (agent.id === 'pharmacy') cardClass = 'border-emerald-500/80 bg-emerald-950/15 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
                  else if (agent.id === 'mobile_klinik') cardClass = 'border-blue-500/80 bg-blue-950/15 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
                } else {
                  cardClass = 'border-slate-900 bg-slate-950/40 hover:border-slate-800 hover:bg-slate-900/10';
                }

                return (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent.id)}
                    className={`text-left p-4.5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${cardClass}`}
                  >
                    <div className={`p-2.5 rounded-xl text-white shrink-0 shadow-md ${
                      agent.id === 'clinic' ? 'bg-purple-600' :
                      agent.id === 'pharmacy' ? 'bg-emerald-600' :
                      'bg-blue-600'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        {agent.name}
                        {isSelected && (
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            agent.id === 'clinic' ? 'bg-purple-400 animate-ping' :
                            agent.id === 'pharmacy' ? 'bg-emerald-400 animate-ping' :
                            'bg-blue-400 animate-ping'
                          }`} />
                        )}
                      </h3>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1 mt-0.5">{agent.role}</span>
                      <p className="text-[11px] text-slate-400 leading-normal">{agent.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tool Banner Alert */}
            {renderToolBanner()}

            {/* 2-Column Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 animate-fadeIn">
              
              {/* Left Column: Connection & Transcript (lg:span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:h-[calc(100vh-320px)] min-h-[500px]">
                <div className="shrink-0">
                  <VoiceAssistant
                    status={status}
                    errorMessage={errorMessage}
                    isMuted={isMuted}
                    inputVolume={inputVolume}
                    isSpeaking={isSpeaking}
                    toggleMute={toggleMute}
                    connect={() => connect(selectedAgent)}
                    disconnect={() => disconnect()}
                  />
                </div>
                <div className="flex-1 min-h-0">
                  <TranscriptPanel transcript={transcript} />
                </div>
              </div>

              {/* Right Column: Database State visualizers (lg:span-7) */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:h-[calc(100vh-320px)] min-h-[500px]">
                {renderDataPanels()}
              </div>

            </div>
          </>
        ) : (
          <UtilizationDashboard dbState={dbState} />
        )}
      </main>

      {/* Footer info bar */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500 bg-slate-950/80">
        <p className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Aura Receptionist Platform. All rights reserved.</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-900">
            <Info className="w-3.5 h-3.5" /> Built for Investor Pitching (Simulated Telephony POC)
          </span>
        </p>
      </footer>
    </div>
  );
}

export default App;
