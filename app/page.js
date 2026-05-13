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
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-indigo-100">
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center shadow-sm shadow-indigo-200">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-gray-900">DraftOps</span>
          </div>
        </div>
        
        <div className="p-4 flex-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Overview</div>
          <nav className="space-y-0.5">
            <NavItem 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>}
              label="Dashboard" 
              isActive={activeNav === "dashboard"}
              onClick={() => setActiveNav("dashboard")}
            />
            <NavItem 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
              label="Incidents" 
              isActive={activeNav === "incidents"}
              onClick={() => setActiveNav("incidents")}
              badge={p1Incidents.length > 0 ? p1Incidents.length : null}
            />
            <NavItem 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
              label="Services" 
              isActive={activeNav === "services"}
              onClick={() => setActiveNav("services")}
            />
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen pb-12">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-semibold text-gray-900">Incident Monitor</h1>
            <div className="h-4 w-px bg-gray-200"></div>
            <span className="text-[13px] text-gray-500 font-medium">Real-time autonomous triage</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-gray-400 font-medium">
              {lastUpdated ? `Sync: ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
            </span>
            <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-semibold text-green-700 tracking-wide uppercase">Live</span>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-8 pt-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatCard 
              title="Total Incidents" 
              value={incidents.length} 
              subtext="Analyzed in last 24h"
              icon={<svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <StatCard 
              title="P1 Critical" 
              value={p1Incidents.length} 
              subtext="Requires immediate attention"
              valueColor={p1Incidents.length > 0 ? "text-red-600" : "text-gray-900"}
              icon={<svg className={`w-5 h-5 ${p1Incidents.length > 0 ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[13px] font-medium text-gray-500">Affected Services</h3>
                <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="text-3xl font-semibold text-gray-900 tracking-tight mb-3">{uniqueServices.length}</div>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {uniqueServices.slice(0, 3).map(service => (
                  <span key={service} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium border border-gray-200 truncate max-w-[90px]">
                    {service}
                  </span>
                ))}
                {uniqueServices.length > 3 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 font-medium border border-gray-200">
                    +{uniqueServices.length - 3}
                  </span>
                )}
                {uniqueServices.length === 0 && (
                  <span className="text-[12px] text-gray-400 font-medium">None currently</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-[14px] font-semibold text-gray-900">Incident Feed</h2>
          </div>
          
          {/* Incident Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl h-36 animate-pulse p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-5 bg-gray-200 rounded-md w-24"></div>
                      <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">All systems operational</h3>
                <p className="text-[13px] text-gray-500">No anomalies detected in the log stream.</p>
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

function StatCard({ title, value, subtext, icon, valueColor = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[13px] font-medium text-gray-500">{title}</h3>
        {icon}
      </div>
      <div className={`text-3xl font-semibold tracking-tight mb-1 ${valueColor}`}>{value}</div>
      <div className="text-[12px] text-gray-400 font-medium mt-auto">{subtext}</div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, badge }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? "bg-gray-100 text-gray-900 font-medium" 
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${isActive ? "text-gray-900" : "text-gray-400"}`}>
          {icon}
        </div>
        <span className="text-[13px]">{label}</span>
      </div>
      {badge && (
        <span className="bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-md text-[10px] leading-none">
          {badge}
        </span>
      )}
    </div>
  );
}

function IncidentRow({ incident, isExpanded, onToggle }) {
  const isP1 = incident.severity === "P1";
  
  return (
    <div className={`bg-white border rounded-xl relative overflow-hidden transition-all shadow-sm ${
      isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      
      {/* P1 Left Indicator (Subtle Stripe) */}
      {isP1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
      
      <div className={`p-6 ${isP1 ? 'ml-1' : ''}`}>
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[15px] text-gray-900 tracking-tight">{incident.service}</span>
            
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
              isP1 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}>
              {incident.severity}
            </span>
            
            {incident.incident_type && incident.incident_type !== "unknown" && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                {incident.incident_type.replace(/_/g, " ")}
              </span>
            )}
          </div>
          
          <div className="text-[12px] text-gray-400 font-medium">
            {new Date(incident.triggered_at).toLocaleString(undefined, { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>

        {/* RCA Content */}
        <div className="mb-5">
          <p className="text-[15px] font-medium text-gray-900 leading-relaxed mb-2">
            {incident.probable_cause}
          </p>
          <div className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
              {incident.recommended_action}
            </p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between mt-2">
          <button 
            onClick={onToggle}
            className="text-[12px] font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
          >
            {isExpanded ? "Hide technical details" : "View technical details"}
            <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>

        {/* Expanded Tech Details */}
        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
              <h4 className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">LLM Reasoning Trace</h4>
            </div>
            <div className="text-[13px] text-gray-600 leading-relaxed bg-[#1E1E1E] text-gray-300 p-4 rounded-lg font-mono shadow-inner overflow-x-auto">
              <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                 <span className="text-indigo-400 text-[11px] uppercase tracking-wider font-bold">Llama-3.3-70B Analysis</span>
                 <span className="text-green-400 text-[11px] font-bold">CONFIDENCE: {incident.confidence?.toUpperCase() || 'HIGH'}</span>
              </div>
              {incident.reasoning}
            </div>
          </div>
        )}
      </div>

      {/* Escalation Required Banner */}
      {incident.needs_escalation && (
        <div className="bg-red-50 border-t border-red-100 px-6 py-2.5 flex items-center gap-2.5">
          <div className="bg-red-100 p-1 rounded-md">
            <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <span className="text-[12px] font-bold text-red-700 uppercase tracking-wide">Manual Escalation Required</span>
        </div>
      )}
    </div>
  );
}
