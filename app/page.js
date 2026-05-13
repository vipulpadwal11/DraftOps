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
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (supabase) {
      fetchIncidents();
      // Auto-refresh every 30 seconds
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
    } catch (err) {
      console.error("Error fetching incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-500 tracking-tighter uppercase">
            Ops
          </div>
        </div>
      </div>
    );
  }

  const filteredIncidents = activeTab === "all" ? incidents : incidents.filter(i => i.severity === activeTab);
  const p1Count = incidents.filter(i => i.severity === "P1").length;
  
  // Real-time calculations for stats
  const uniqueServices = new Set(incidents.map(i => i.service)).size;
  
  const getLatestTime = () => {
    if (incidents.length === 0) return "No incidents";
    const diff = new Date() - new Date(incidents[0].triggered_at);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent text-gray-900 font-sans selection:bg-blue-200">
      {/* Background Grid Decor */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">Pipeline Active</span>
            </div>
            <h1 className="text-4xl font-outfit font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500">
              DraftOps <span className="text-blue-600 font-medium">Pulse</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            {["all", "P1", "P2"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${
                  activeTab === tab 
                    ? "bg-gray-900 text-white shadow-md" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab === "all" ? "Overview" : tab}
              </button>
            ))}
          </div>
        </header>

        {/* Hero Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <StatCard label="Live Incidents" value={incidents.length} sub="Total ingested" />
          <StatCard label="Critical Issues" value={p1Count} sub="P1 priority" color="text-red-600" />
          <StatCard label="Affected Services" value={uniqueServices} sub="Real-time count" />
          <StatCard label="Latest Incident" value={getLatestTime()} sub="Last detection" color="text-blue-600" isTextValue={true} />
        </section>

        {/* Incident List */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-200 border-dashed shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl text-gray-400">✓</span>
              </div>
              <p className="text-gray-500 font-medium">No {activeTab !== "all" ? activeTab : ""} incidents detected.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredIncidents.map((incident) => (
                <IncidentCard 
                  key={incident.id} 
                  incident={incident} 
                  isExpanded={expandedId === incident.id}
                  onToggle={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="mt-20 pt-8 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          <p>© 2026 DraftOps Autonomous Systems</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Supabase Sync</span>
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> LangGraph RCA</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-gray-900", isTextValue = false }) {
  return (
    <div className="group relative overflow-hidden bg-white shadow-sm p-8 rounded-[2rem] border border-gray-200 hover:border-gray-300 transition-all duration-500 hover:-translate-y-1 hover:shadow-md">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="w-20 h-20 bg-gray-900 rounded-full"></div>
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">{label}</p>
      <p className={`${isTextValue ? 'text-3xl mt-2 mb-4' : 'text-5xl mb-2'} font-outfit font-black tracking-tighter ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 font-medium">{sub}</p>
    </div>
  );
}

function IncidentCard({ incident, isExpanded, onToggle }) {
  const isP1 = incident.severity === "P1";
  
  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${
      isExpanded ? "ring-2 ring-blue-500/20 bg-blue-50/30" : "bg-white hover:bg-gray-50 shadow-sm hover:shadow"
    } ${isP1 ? "border-red-200 hover:border-red-300" : "border-gray-200 hover:border-gray-300"}`}>
      
      {/* Accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isP1 ? "bg-red-500" : "bg-blue-500"}`}></div>

      <div className="p-8 md:p-10">
        <div className="flex flex-wrap justify-between items-start gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-outfit font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                {incident.service}
              </h3>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isP1 ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
              }`}>
                {incident.severity}
              </div>
              {incident.incident_type && incident.incident_type !== "unknown" && (
                <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                  {incident.incident_type.replace(/_/g, " ")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="text-blue-500">#</span> {incident.id.toString().slice(-6)}
              </span>
              <span>•</span>
              <span>{new Date(incident.triggered_at).toLocaleString(undefined, { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
              })}</span>
            </div>
          </div>

          {incident.needs_escalation && (
            <div className="animate-pulse flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
              <span>⚠</span> Critical Escalation
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
            <p className="text-xl font-medium leading-relaxed text-gray-800">
              {incident.probable_cause}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 shadow-sm">
                →
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Recommended Action</p>
                <p className="text-gray-600 font-medium">{incident.recommended_action}</p>
              </div>
            </div>

            <button 
              onClick={onToggle}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${
                isExpanded 
                  ? "bg-gray-900 text-white hover:bg-gray-800" 
                  : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {isExpanded ? "Close Report" : "Technical RCA"}
            </button>
          </div>
        </div>

        {/* Technical Detail Section */}
        {isExpanded && (
          <div className="mt-10 pt-10 border-t border-gray-200 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span> Diagnostic Reasoning
                </p>
                <div className="space-y-4 text-gray-600 text-sm leading-relaxed font-medium">
                  {incident.reasoning.split('. ').map((sentence, idx) => (
                    sentence && <p key={idx} className="flex gap-3"><span className="text-gray-400 shrink-0">0{idx+1}</span> {sentence}.</p>
                  ))}
                </div>
              </div>
              <div className="bg-white shadow-inner border border-gray-100 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <span className="text-4xl font-black italic tracking-tighter text-gray-900">AI</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Autonomous Triage</p>
                <div className="space-y-4 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Model:</span>
                    <span className="text-blue-600 font-semibold">LLAMA-3.3-70B</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Confidence:</span>
                    <span className="text-green-600 font-semibold">{incident.confidence?.toUpperCase() || "HIGH"}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Context Size:</span>
                    <span className="text-gray-600 font-semibold">1.2k tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
