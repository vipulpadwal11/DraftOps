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
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-mono">
        <div className="text-[#CC6B49] font-bold animate-pulse text-lg">Initializing DraftOps...</div>
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
    <div className="min-h-screen bg-[#FAF9F5] text-[#111111] font-mono selection:bg-[#F2EFEA]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#111111] mb-3">
              DraftOps
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-[#CC6B49] rounded-full animate-pulse shadow-sm"></div>
              <span className="text-sm font-semibold text-[#5C5852]">Autonomous Incident Monitoring</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#E5E1D8] p-1 rounded-lg">
            {["all", "P1", "P2"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? "bg-white text-[#111111] shadow-sm" 
                    : "text-[#5C5852] hover:text-[#111111]"
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
          <StatCard label="Critical Issues" value={p1Count} sub="P1 priority" color="text-[#D94A38]" />
          <StatCard label="Affected Services" value={uniqueServices} sub="Real-time count" />
          <StatCard label="Latest Incident" value={getLatestTime()} sub="Last detection" color="text-[#CC6B49]" />
        </section>

        {/* Incident List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#111111] mb-4 border-b-2 border-[#E5E1D8] pb-4">Activity Feed</h2>
          
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border-2 border-[#E5E1D8]">
              <p className="text-[#5C5852] font-medium text-lg">No {activeTab !== "all" ? activeTab : ""} incidents detected.</p>
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
        <footer className="mt-24 pt-8 border-t-2 border-[#E5E1D8] flex justify-between items-center text-xs font-semibold text-[#7A756C] uppercase tracking-wider">
          <p>© 2026 DraftOps</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#8DA399] rounded-full"></div> Supabase</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#CC6B49] rounded-full"></div> LangGraph</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-[#111111]" }) {
  return (
    <div className="bg-white p-6 rounded-xl border-2 border-[#E5E1D8] hover:border-[#CC6B49] transition-colors shadow-sm">
      <p className="text-xs font-bold text-[#7A756C] uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-4xl font-bold mb-2 ${color}`}>{value}</p>
      <p className="text-sm font-medium text-[#7A756C]">{sub}</p>
    </div>
  );
}

function IncidentCard({ incident, isExpanded, onToggle }) {
  const isP1 = incident.severity === "P1";
  
  return (
    <div className={`bg-white rounded-xl border-2 transition-all duration-200 ${
      isExpanded ? "border-[#CC6B49] shadow-md" : "border-[#E5E1D8] hover:border-[#D1CCC2] shadow-sm"
    }`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold text-[#111111]">
                {incident.service}
              </h3>
              <div className={`px-3 py-1 rounded text-xs font-bold tracking-widest uppercase ${
                isP1 ? "bg-[#D94A38] text-white" : "bg-[#E5E1D8] text-[#111111]"
              }`}>
                {incident.severity}
              </div>
              {incident.incident_type && incident.incident_type !== "unknown" && (
                <div className="text-sm font-semibold text-[#7A756C] uppercase tracking-wider">
                  {incident.incident_type.replace(/_/g, " ")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-[#7A756C]">
              <span className="bg-[#F0EEE6] px-2 py-0.5 rounded text-[#5C5852]">ID: {incident.id.toString().slice(-6)}</span>
              <span>•</span>
              <span className="text-[#111111]">{new Date(incident.triggered_at).toLocaleString(undefined, { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}</span>
            </div>
          </div>

          {incident.needs_escalation && (
            <div className="flex items-center gap-2 text-sm font-bold text-white bg-[#D94A38] px-4 py-2 rounded-lg shadow-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> ESCALATION REQUIRED
            </div>
          )}
        </div>

        <div className="space-y-6">
          <p className="text-base font-medium text-[#111111] leading-relaxed bg-[#FAF9F5] p-5 rounded-lg border border-[#E5E1D8]">
            {incident.probable_cause}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-start gap-3 bg-[#FFF5F2] p-4 rounded-lg border border-[#FADBD8] flex-1">
              <div className="text-[#CC6B49] font-bold text-lg mt-0.5">↳</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#CC6B49] mb-1">Recommendation</p>
                <p className="text-sm font-semibold text-[#3B3836] leading-relaxed">{incident.recommended_action}</p>
              </div>
            </div>

            <button 
              onClick={onToggle}
              className="px-6 py-4 rounded-lg text-xs font-bold uppercase tracking-widest bg-[#111111] hover:bg-[#3B3836] text-white transition-colors shrink-0 shadow-sm"
            >
              {isExpanded ? "Hide Details" : "View Details"}
            </button>
          </div>
        </div>

        {/* Technical Detail Section */}
        {isExpanded && (
          <div className="mt-8 pt-8 border-t-2 border-[#E5E1D8]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-[#111111] mb-5 border-b-2 border-[#E5E1D8] pb-2">Reasoning Trace</p>
                <div className="space-y-4 text-sm font-medium text-[#5C5852] leading-relaxed">
                  {incident.reasoning.split('. ').map((sentence, idx) => (
                    sentence && (
                      <div key={idx} className="flex gap-4">
                        <span className="text-[#CC6B49] font-bold">{(idx+1).toString().padStart(2, '0')}</span> 
                        <p>{sentence}.</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
              <div className="bg-[#FAF9F5] rounded-xl p-6 border-2 border-[#E5E1D8] h-fit">
                <p className="text-sm font-bold uppercase tracking-widest text-[#111111] mb-5">Metadata</p>
                <div className="space-y-4 text-sm font-semibold">
                  <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3">
                    <span className="text-[#7A756C]">Model</span>
                    <span className="text-[#111111] bg-white px-2 py-1 rounded border border-[#E5E1D8]">llama-3.3-70b</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3">
                    <span className="text-[#7A756C]">Confidence</span>
                    <span className="text-[#8DA399]">{incident.confidence?.toUpperCase() || "HIGH"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7A756C]">Context Size</span>
                    <span className="text-[#111111]">1.2k tokens</span>
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
