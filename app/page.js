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
        <div className="text-[#CC6B49] animate-pulse">Initializing DraftOps...</div>
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
    <div className="min-h-screen bg-[#FAF9F5] text-[#3B3836] font-mono selection:bg-[#F2EFEA]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-[#1E1D1B] mb-2">
              DraftOps
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#CC6B49] rounded-full animate-pulse"></div>
              <span className="text-sm text-[#7A756C]">Autonomous Incident Monitoring</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#F0EEE6] p-1 rounded-lg">
            {["all", "P1", "P2"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs transition-all ${
                  activeTab === tab 
                    ? "bg-white text-[#1E1D1B] shadow-sm" 
                    : "text-[#7A756C] hover:text-[#1E1D1B]"
                }`}
              >
                {tab === "all" ? "Overview" : tab}
              </button>
            ))}
          </div>
        </header>

        {/* Hero Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <StatCard label="Live Incidents" value={incidents.length} sub="Total ingested" />
          <StatCard label="Critical Issues" value={p1Count} sub="P1 priority" color="text-[#D94A38]" />
          <StatCard label="Affected Services" value={uniqueServices} sub="Real-time count" />
          <StatCard label="Latest Incident" value={getLatestTime()} sub="Last detection" color="text-[#CC6B49]" />
        </section>

        {/* Incident List */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-[#1E1D1B] mb-2 border-b border-[#E5E1D8] pb-4">Activity Feed</h2>
          
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E5E1D8]">
              <p className="text-[#7A756C]">No {activeTab !== "all" ? activeTab : ""} incidents detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
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
        <footer className="mt-24 pt-8 border-t border-[#E5E1D8] flex justify-between items-center text-xs text-[#7A756C]">
          <p>© 2026 DraftOps</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#8DA399] rounded-full"></div> Supabase</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#CC6B49] rounded-full"></div> LangGraph</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-[#1E1D1B]" }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#E5E1D8] hover:border-[#D1CCC2] transition-colors">
      <p className="text-xs text-[#7A756C] mb-3">{label}</p>
      <p className={`text-2xl font-medium mb-1 ${color}`}>{value}</p>
      <p className="text-xs text-[#9E988F]">{sub}</p>
    </div>
  );
}

function IncidentCard({ incident, isExpanded, onToggle }) {
  const isP1 = incident.severity === "P1";
  
  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 ${
      isExpanded ? "border-[#D1CCC2] shadow-sm" : "border-[#E5E1D8] hover:border-[#D1CCC2]"
    }`}>
      <div className="p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-[#1E1D1B]">
                {incident.service}
              </h3>
              <div className={`px-2 py-0.5 rounded text-xs ${
                isP1 ? "bg-[#FDF2F0] text-[#D94A38] border border-[#FADBD8]" : "bg-[#F2EFEA] text-[#7A756C] border border-[#E5E1D8]"
              }`}>
                {incident.severity}
              </div>
              {incident.incident_type && incident.incident_type !== "unknown" && (
                <div className="text-xs text-[#9E988F]">
                  {incident.incident_type.replace(/_/g, " ")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-[#9E988F]">
              <span>ID: {incident.id.toString().slice(-6)}</span>
              <span>•</span>
              <span>{new Date(incident.triggered_at).toLocaleString(undefined, { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}</span>
            </div>
          </div>

          {incident.needs_escalation && (
            <div className="flex items-center gap-2 text-xs text-[#D94A38] bg-[#FDF2F0] px-3 py-1.5 rounded-md border border-[#FADBD8]">
              <span className="w-1.5 h-1.5 bg-[#D94A38] rounded-full animate-pulse"></span> Escalation Required
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[#3B3836] leading-relaxed">
            {incident.probable_cause}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="text-[#CC6B49] mt-0.5">↳</div>
              <div>
                <p className="text-xs text-[#CC6B49] mb-0.5">Recommendation</p>
                <p className="text-sm text-[#5C5852]">{incident.recommended_action}</p>
              </div>
            </div>

            <button 
              onClick={onToggle}
              className="px-4 py-2 rounded-lg text-xs bg-[#F0EEE6] hover:bg-[#E5E1D8] text-[#3B3836] transition-colors shrink-0"
            >
              {isExpanded ? "Hide Details" : "View Details"}
            </button>
          </div>
        </div>

        {/* Technical Detail Section */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-[#E5E1D8]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <p className="text-xs text-[#7A756C] mb-4 border-b border-[#E5E1D8] pb-2">Reasoning Trace</p>
                <div className="space-y-3 text-sm text-[#5C5852] leading-relaxed">
                  {incident.reasoning.split('. ').map((sentence, idx) => (
                    sentence && (
                      <div key={idx} className="flex gap-3">
                        <span className="text-[#D1CCC2]">{(idx+1).toString().padStart(2, '0')}</span> 
                        <p>{sentence}.</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
              <div className="bg-[#FAF9F5] rounded-lg p-5 border border-[#E5E1D8] h-fit">
                <p className="text-xs text-[#7A756C] mb-4">Metadata</p>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#9E988F]">Model</span>
                    <span className="text-[#3B3836]">llama-3.3-70b</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9E988F]">Confidence</span>
                    <span className="text-[#8DA399]">{incident.confidence?.toUpperCase() || "HIGH"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9E988F]">Context Size</span>
                    <span className="text-[#3B3836]">1.2k tokens</span>
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
