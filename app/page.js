"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only initialize if we have the keys, to prevent errors on SSR
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (supabase) {
      fetchIncidents();
    } else {
      setLoading(false);
      console.error("Supabase credentials missing in .env.local");
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <p className="text-xl animate-pulse">Loading incidents...</p>
      </div>
    );
  }

  const totalIncidents = incidents.length;
  const p1Incidents = incidents.filter((i) => i.severity === "P1").length;
  const uniqueServices = new Set(incidents.map((i) => i.service)).size;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">Project Pulse</h1>
          <h2 className="text-lg font-medium text-gray-400">AIOps Dashboard</h2>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800/60 shadow-lg hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm font-medium mb-2">Total Incidents</p>
            <p className="text-5xl font-bold tracking-tight">{totalIncidents}</p>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800/60 shadow-lg hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm font-medium mb-2">P1 Incidents</p>
            <p className="text-5xl font-bold tracking-tight text-red-500">{p1Incidents}</p>
          </div>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800/60 shadow-lg hover:border-gray-700 transition-colors">
            <p className="text-gray-400 text-sm font-medium mb-2">Services Affected</p>
            <p className="text-5xl font-bold tracking-tight">{uniqueServices}</p>
          </div>
        </section>

        <section>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] rounded-2xl border border-gray-800/60 border-dashed">
              <p className="text-gray-400 text-lg">No incidents recorded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-[#1a1a1a] rounded-2xl border border-gray-800/60 shadow-xl overflow-hidden transition-all hover:border-gray-700 group"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-white">
                          {incident.service}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            incident.severity === "P1"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}
                        >
                          {incident.severity}
                        </span>
                        {incident.incident_type && incident.incident_type !== "unknown" && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                            {incident.incident_type.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-gray-500 bg-[#0a0a0a] px-3 py-1.5 rounded-full border border-gray-800">
                        {new Date(incident.triggered_at).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <p className="text-white text-lg font-medium leading-snug mb-3">
                      {incident.probable_cause}
                    </p>
                    <p className="text-gray-400 mb-6 text-sm flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">↳</span>
                      {incident.recommended_action}
                    </p>

                    <div className="border-t border-gray-800/60 pt-4">
                      <button
                        onClick={() => toggleExpand(incident.id)}
                        className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-2"
                      >
                        <span className="font-mono text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-300 group-hover:bg-gray-700 transition-colors">
                          {expandedId === incident.id ? "-" : "+"}
                        </span>
                        {expandedId === incident.id ? "Hide Reasoning" : "Show Technical Reasoning"}
                      </button>

                      {expandedId === incident.id && (
                        <div className="mt-4 p-5 bg-[#0a0a0a] rounded-xl text-gray-300 text-sm leading-relaxed border border-gray-800 shadow-inner">
                          {incident.reasoning}
                        </div>
                      )}
                    </div>
                  </div>

                  {incident.needs_escalation && (
                    <div className="bg-red-500/10 text-red-400 text-center py-3 text-sm font-bold tracking-widest uppercase border-t border-red-500/20 flex items-center justify-center gap-2">
                      <span className="text-base">⚠</span> Escalation Required
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
