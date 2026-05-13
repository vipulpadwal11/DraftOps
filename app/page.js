"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (supabase) {
      fetchIncidents();
      const interval = setInterval(fetchIncidents, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setIncidents(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  const p1Count = incidents.filter(i => i.severity === "P1").length;
  const isHealthy = p1Count === 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-100">
      
      {/* Top Navbar - Vercel Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs tracking-tighter">DO</span>
              </div>
              <span className="font-semibold text-sm tracking-tight">DraftOps</span>
              <span className="text-gray-300 mx-1">/</span>
              <span className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">Acme Corp</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <NavLink active>Command Center</NavLink>
              <NavLink>Services</NavLink>
              <NavLink>Integrations</NavLink>
              <NavLink>Settings</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 hidden sm:block">
              Ctrl K to search
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-white shadow-sm cursor-pointer"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header Area */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Command Center</h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Autonomous incident resolution and real-time environment monitoring.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">
              {lastUpdated ? `Last sync: ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
            </span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isHealthy ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isHealthy ? 'System Optimal' : 'Critical Issues'}
            </div>
          </div>
        </header>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Feed Column (70%) */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-sm font-semibold text-gray-900">Incident Inbox</h2>
              <div className="flex items-center gap-2">
                <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Filter</button>
                <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Sort</button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-white border border-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl py-24 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Inbox Zero</h3>
                <p className="text-xs text-gray-500">Your environment is running smoothly.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                {incidents.map((incident, idx) => (
                  <DenseIncidentRow 
                    key={incident.id} 
                    incident={incident} 
                    isExpanded={expandedId === incident.id}
                    onToggle={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                    isLast={idx === incidents.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar (30%) */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Environment Health</h3>
              
              <div className="space-y-5">
                <HealthMetric label="Active Incidents" value={incidents.length} />
                <HealthMetric label="P1 Critical" value={p1Count} color={p1Count > 0 ? "text-red-600" : "text-gray-900"} />
                <HealthMetric label="Services Affected" value={new Set(incidents.map(i => i.service)).size} />
                <HealthMetric label="MTTR" value="14m" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Autonomous Actions</h3>
              <div className="space-y-4">
                <ActionItem icon="slack" text="Alerted on #eng-ops" time="2m ago" />
                <ActionItem icon="github" text="Created Issue #142" time="2m ago" />
                <ActionItem icon="ai" text="RCA generated by Llama 3" time="3m ago" />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function NavLink({ children, active }) {
  return (
    <div className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors ${
      active ? "text-black bg-gray-100" : "text-gray-500 hover:text-black hover:bg-gray-50"
    }`}>
      {children}
    </div>
  );
}

function HealthMetric({ label, value, color = "text-gray-900" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`text-lg font-semibold tracking-tight ${color}`}>{value}</span>
    </div>
  );
}

function ActionItem({ icon, text, time }) {
  const getIcon = () => {
    if (icon === 'slack') return <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">#</div>;
    if (icon === 'github') return <div className="w-6 h-6 rounded bg-gray-100 text-gray-800 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></div>;
    if (icon === 'ai') return <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="text-sm font-medium text-gray-700">{text}</span>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

function DenseIncidentRow({ incident, isExpanded, onToggle, isLast }) {
  const isP1 = incident.severity === "P1";
  
  return (
    <div className={`group transition-colors ${!isLast ? 'border-b border-gray-100' : ''} ${isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
      
      {/* Clickable Row */}
      <div 
        onClick={onToggle}
        className="px-5 py-4 cursor-pointer flex items-center gap-4 relative"
      >
        {incident.needs_escalation && !isExpanded && (
           <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500"></div>
        )}

        <div className={`w-2 h-2 rounded-full shrink-0 ${isP1 ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
        
        <div className="w-32 shrink-0">
          <span className="text-[13px] font-semibold text-gray-900 truncate block">{incident.service}</span>
          <span className="text-[11px] text-gray-500 font-mono mt-0.5 block">{incident.id.toString().slice(-6)}</span>
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
              isP1 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {incident.severity}
            </span>
            <span className="text-[13px] font-medium text-gray-900 truncate">
              {incident.incident_type !== "unknown" ? incident.incident_type.replace(/_/g, " ") : "Anomaly Detected"}
            </span>
          </div>
          <span className="text-[13px] text-gray-500 truncate block">
            {incident.probable_cause}
          </span>
        </div>

        <div className="text-[12px] text-gray-400 font-medium shrink-0 flex items-center gap-4">
          {new Date(incident.triggered_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          <svg className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* Expanded Content - Terminal Style */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100/50">
          
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 mt-4">
            {/* Left: Triage & RCA */}
            <div className="space-y-5">
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Automated Triage</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-[13px] text-gray-700 leading-relaxed">
                  {incident.probable_cause}
                </div>
              </div>
              
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recommended Action</h4>
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 shadow-sm text-[13px] text-indigo-900 font-medium leading-relaxed flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  {incident.recommended_action}
                </div>
              </div>
            </div>

            {/* Right: LLM Trace */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reasoning Trace</h4>
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">HIGH CONFIDENCE</span>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-4 shadow-inner text-gray-300 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto">
                <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2 flex justify-between">
                  <span>&gt; llama-3.3-70b</span>
                  <span>{new Date(incident.triggered_at).toLocaleTimeString()}</span>
                </div>
                {incident.reasoning}
              </div>
            </div>
          </div>

          {incident.needs_escalation && (
            <div className="mt-6 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-1.5 rounded-md text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Manual Escalation Required</h4>
                  <p className="text-xs text-red-600 mt-0.5">Automated resolution failed. Engineer intervention required.</p>
                </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-colors">
                Acknowledge
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
