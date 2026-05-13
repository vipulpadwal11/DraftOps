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
  const [activeNav, setActiveNav] = useState("dashboard");

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

  const p1Incidents = incidents.filter(i => i.severity === "P1");
  const uniqueServices = Array.from(new Set(incidents.map((i) => i.service)));

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-[#222] bg-[#0a0a0a] flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border border-gray-600 flex items-center justify-center shadow-sm">
            <span className="font-bold text-lg leading-none tracking-tighter">D</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">DraftOps</span>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1">
          <NavItem 
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            label="Dashboard" 
            isActive={activeNav === "dashboard"}
            onClick={() => setActiveNav("dashboard")}
          />
          <NavItem 
            icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            label="Incidents" 
            isActive={activeNav === "incidents"}
            onClick={() => setActiveNav("incidents")}
            badge={p1Incidents.length > 0 ? p1Incidents.length : null}
          />
          <NavItem 
            icon="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" 
            label="Services" 
            isActive={activeNav === "services"}
            onClick={() => setActiveNav("services")}
          />
        </nav>
        
        <div className="p-4 border-t border-[#222]">
          <div className="flex items-center gap-3 px-2 py-2 text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          
          {/* Header */}
          <header className="flex justify-between items-end mb-10 pb-6 border-b border-[#222]">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-100">Incident Monitor</h1>
              <p className="text-sm text-gray-500 mt-1">Real-time anomaly detection and root cause analysis.</p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 bg-[#111] border border-[#222] px-3 py-1.5 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <span className="text-xs font-medium text-gray-300">Live</span>
              </div>
              <span className="text-[11px] text-gray-600 font-medium">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
              </span>
            </div>
          </header>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total Incidents */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-[#222] rounded-2xl p-6 relative overflow-hidden group hover:border-[#333] transition-colors">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Incidents</h3>
              <div className="text-4xl font-semibold text-white tracking-tight">{incidents.length}</div>
            </div>

            {/* P1 Critical */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-[#222] rounded-2xl p-6 relative overflow-hidden group hover:border-[#333] transition-colors">
               <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.03] to-transparent pointer-events-none"></div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">P1 Critical</h3>
              <div className="text-4xl font-semibold text-red-500 tracking-tight">{p1Incidents.length}</div>
            </div>

            {/* Services Affected */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-[#222] rounded-2xl p-6 relative overflow-hidden group hover:border-[#333] transition-colors flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Services Affected</h3>
              <div className="text-4xl font-semibold text-white tracking-tight mb-3">{uniqueServices.length}</div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {uniqueServices.slice(0, 3).map(service => (
                  <span key={service} className="text-[10px] px-2 py-1 rounded bg-[#222] text-gray-400 font-medium truncate max-w-[80px]">
                    {service}
                  </span>
                ))}
                {uniqueServices.length > 3 && (
                  <span className="text-[10px] px-2 py-1 rounded bg-[#222] text-gray-400 font-medium">
                    +{uniqueServices.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Incident Feed */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-400 mb-4 px-1">Recent Activity</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[#0f0f0f] border border-[#222] rounded-xl h-32 animate-pulse relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#222]"></div>
                    <div className="p-6 ml-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-4 bg-[#222] rounded w-32"></div>
                        <div className="h-4 bg-[#222] rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-[#222] rounded w-3/4"></div>
                      <div className="h-3 bg-[#222] rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="bg-[#0f0f0f] border border-[#222] rounded-2xl py-24 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-lg font-medium text-green-500 mb-1">All systems operational</h3>
                <p className="text-sm text-gray-500">No incidents in the last 24 hours</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <IncidentRow 
                  key={incident.id} 
                  incident={incident} 
                  isExpanded={expandedId === incident.id}
                  onToggle={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                />
              ))
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, badge }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-[#1f1f1f] text-gray-100" : "text-gray-500 hover:bg-[#111] hover:text-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path>
        </svg>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && (
        <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function IncidentRow({ incident, isExpanded, onToggle }) {
  const isP1 = incident.severity === "P1";
  
  return (
    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl relative overflow-hidden transition-all hover:border-[#333]">
      {/* Left Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isP1 ? "bg-red-500" : "bg-yellow-500"}`}></div>
      
      <div className="p-5 ml-1">
        {/* Top Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white tracking-tight">{incident.service}</span>
            
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              isP1 
                ? "bg-[#ff000020] text-red-400 border-red-500/30" 
                : "bg-[#ffff0020] text-yellow-400 border-yellow-500/30"
            }`}>
              {incident.severity}
            </span>
            
            {incident.incident_type && incident.incident_type !== "unknown" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#ffffff10] text-gray-300 border border-transparent">
                {incident.incident_type.replace(/_/g, " ")}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500 font-medium">
            {new Date(incident.triggered_at).toLocaleString(undefined, { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-[16px] text-white leading-snug mb-1.5">{incident.probable_cause}</p>
          <p className="text-[14px] text-[#888] flex items-start gap-2">
            <span className="text-gray-600 shrink-0 select-none">↳</span> 
            {incident.recommended_action}
          </p>
        </div>

        {/* Actions */}
        <div>
          <button 
            onClick={onToggle}
            className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-[#333] hover:border-[#444]"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            {isExpanded ? "Hide reasoning" : "View reasoning"}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#222]">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Diagnostic Reasoning</h4>
            <div className="text-sm text-gray-400 leading-relaxed bg-[#141414] p-4 rounded-lg border border-[#222]">
              {incident.reasoning}
            </div>
          </div>
        )}
      </div>

      {/* Escalation Banner */}
      {incident.needs_escalation && (
        <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border-t border-red-500/20 px-5 py-2.5 ml-1 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span className="text-xs font-semibold text-red-500 tracking-wide uppercase">Escalation Required</span>
        </div>
      )}
    </div>
  );
}
