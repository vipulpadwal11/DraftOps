# DraftOps — AIOps Incident Response Agent
### Product Requirements Document (PRD)
**Version:** 1.0  
**Author:** Vipul Padwal  
**Status:** In Progress  
**Last Updated:** May 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target User](#4-target-user)
5. [Core User Flow](#5-core-user-flow)
6. [Tech Stack](#6-tech-stack)
7. [System Architecture](#7-system-architecture)
8. [Component Breakdown](#8-component-breakdown)
9. [LLM Fallback Architecture](#9-llm-fallback-architecture)
10. [Prompt Engineering Strategy](#10-prompt-engineering-strategy)
11. [Data Schema](#11-data-schema)
12. [Environment Variables](#12-environment-variables)
13. [Scope — In & Out](#13-scope--in--out)
14. [Build Timeline](#14-build-timeline)
15. [CV & Portfolio Notes](#15-cv--portfolio-notes)

---

## 1. Overview

**DraftOps** is an autonomous AIOps incident response agent that monitors system metrics, detects anomalies, performs root cause analysis using LLMs, and executes response actions — all in a single automated pipeline.

The agent is built for a job portfolio to demonstrate production-grade AI engineering skills including multi-step LLM orchestration, tool calling, MCP integrations, memory-augmented reasoning, and automatic LLM fallback architecture.

---

## 2. Problem Statement

Engineering teams waste hours every week on manual incident triage:

- Alert floods wake on-call engineers at 2am for noise
- Diagnosing root cause requires manually reading logs, correlating timestamps, and checking past incidents
- Creating GitHub issues, sending Slack alerts, and drafting escalation messages all happen manually
- Institutional knowledge about past incidents lives in people's heads, not systems

There is no lightweight tool that handles the full loop — **monitor → reason → act** — autonomously.

---

## 3. Goals & Success Metrics

### Primary Goal
Demonstrate a production-pattern AIOps agent for CV/portfolio to get a job in AI engineering.

### Success Criteria

| Metric | Target |
|---|---|
| Noise filter accuracy | Correctly filters >80% of non-critical alerts in testing |
| RCA output quality | Produces structured JSON with valid probable_cause on every run |
| GitHub issue creation | Auto-created on every P1 incident |
| Slack alert delivery | Sent within seconds of P1 detection |
| Dashboard | Shows full incident history with agent reasoning visible |
| LLM fallback | Gemini activates automatically when Groq fails, zero manual intervention |

---

## 4. Target User

**Primary:** Small-to-mid engineering teams (5–50 engineers) without a dedicated SRE team.

**Secondary:** Solo founders or indie developers running production services who need incident visibility without enterprise tooling costs.

**For this build:** Single-user, no auth required. Designed for demo and portfolio purposes.

---

## 5. Core User Flow

```
Mock logs generated
        ↓
Anomaly Detector runs threshold checks
        ↓
Alert fired? → No → Stop, nothing to do
        ↓ Yes
Noise Filter (LLM) — real incident or noise?
        ↓ Noise → Stop
        ↓ Real incident
Memory fetch — pull past similar incidents from Supabase
        ↓
Root Cause Analysis (LLM + memory context)
        ↓
Save incident to Supabase
        ↓
Execute Actions:
  ├── Create GitHub issue (GitHub MCP)
  ├── Send Slack alert (Slack MCP)
  └── needs_escalation = true? → Print escalation flag
                                   Human decides, no auto-send
        ↓
Dashboard updates with new incident
```

---

## 6. Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Agent orchestration | LangGraph | Multi-node StateGraph with conditional routing |
| AI reasoning — primary | Groq API | Model: `llama-3.3-70b-versatile` |
| AI reasoning — fallback | Google Gemini 2.5 Flash | Model: `gemini-2.5-flash` |
| Fallback logic | Custom `llm_client.py` | Auto-switches on any Groq exception |
| Memory + storage | Supabase (PostgreSQL) | Incidents table, past incident retrieval |
| GitHub integration | GitHub MCP | Auto issue creation |
| Slack integration | Slack MCP | Webhook-based alerts |
| Frontend dashboard | Next.js + Tailwind CSS | Dark theme, real-time incident feed |
| Mock data | JSON files | Simulated logs, no real server needed |
| Backend language | Python | All agent logic |
| Package management | pip + .env | Environment-based config |

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        LangGraph Agent                       │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Node 1  │───▶│  Node 2  │───▶│  Node 3  │              │
│  │ Detect   │    │  Filter  │    │  Fetch   │              │
│  │Anomalies │    │  Noise   │    │  Memory  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│       │               │                │                    │
│    No alerts       Is noise         Supabase               │
│       ↓               ↓                ↓                    │
│      END             END          ┌──────────┐             │
│                                   │  Node 4  │             │
│                                   │   RCA    │             │
│                                   │  Agent   │             │
│                                   └──────────┘             │
│                                        │                    │
│                                   ┌──────────┐             │
│                                   │  Node 5  │             │
│                                   │ Execute  │             │
│                                   │ Actions  │             │
│                                   └──────────┘             │
│                                        │                    │
│                              GitHub Issue + Slack Alert     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────────────────┐
│  llm_client  │     │         Supabase              │
│              │     │                               │
│  1. Groq     │     │  incidents table              │
│     ↓ fails  │     │  - save_incident()            │
│  2. Gemini   │     │  - get_past_incidents()        │
│     ↓ fails  │     │  - get_all_incidents()         │
│  3. Raise    │     └──────────────────────────────┘
│  LLMUnavail  │
└──────────────┘
```

---

## 8. Component Breakdown

### Component 0 — Shared LLM Client
**File:** `llm_client.py`  
**Job:** Single function `call_llm(system_prompt, user_message)` used by all modules. Handles Groq → Gemini fallback transparently. No module imports AI SDKs directly — all go through here.  
**Returns:** Text response string from whichever LLM succeeded.  
**Raises:** `LLMUnavailableError` if both fail.

---

### Component 1 — Mock Log Generator
**File:** `mock_log_generator.py`  
**Job:** Generate realistic fake system logs as JSON. No real server needed.  
**Output:** `mock_logs.json` — 50 log entries  
**Services simulated:** `auth-service`, `payment-service`, `api-gateway`  
**Modes:**
- Normal: healthy baseline metrics
- Incident: one service degrading with realistic spike pattern over 5 minutes

**Each log entry fields:**

| Field | Type | Description |
|---|---|---|
| timestamp | ISO string | Log timestamp |
| service | string | Which microservice |
| level | INFO / WARN / ERROR | Log severity |
| message | string | Realistic error message |
| cpu_usage | 0–100 | CPU % |
| memory_usage | 0–100 | Memory % |
| error_rate | 0–100 | Failing requests/sec |
| latency_ms | integer | Response time in ms |

---

### Component 2 — Anomaly Detector
**File:** `anomaly_detector.py`  
**Job:** Read `mock_logs.json`, apply threshold rules, return alerts.  
**No LLM used here** — pure rule-based logic.

**Alert rules:**

| Rule | Threshold | Alert Type |
|---|---|---|
| CPU sustained high | >85% for 3+ consecutive entries | `cpu` |
| Error rate spike | error_rate > 20 | `error_rate` |
| High latency | latency_ms > 1500 | `latency` |
| Error log count | 3+ ERROR entries in last 10 | `error_count` |

**Severity:**
- `P1` — 2 or more rules trigger simultaneously on same service
- `P2` — Single rule triggers

**Returns:** List of alert dicts. Empty list if no anomalies.

**Alert dict structure:**
```json
{
  "service": "payment-service",
  "alert_type": "error_rate",
  "severity": "P1",
  "triggered_at": "2026-05-13T14:32:00Z",
  "raw_logs": [ ...last 5 log entries for this service ]
}
```

---

### Component 3 — Noise Filter
**File:** `noise_filter.py`  
**Job:** Use LLM to decide if alert is real or noise.  
**Uses:** `call_llm()` from `llm_client.py`

**System prompt strategy:** Conservative bias — instructs LLM to default to real if unsure. Never miss a real incident.

**Returns:**
```json
{
  "is_real_incident": true,
  "confidence": "high",
  "reason": "Error rate 3x above baseline with simultaneous latency spike"
}
```

**Fallback on JSON parse failure:** Defaults to `is_real_incident: true` to avoid missing real incidents.

---

### Component 4 — Root Cause Analysis Agent
**File:** `rca_agent.py`  
**Job:** Perform deep root cause analysis using current alert + historical memory context.  
**Uses:** `call_llm()` from `llm_client.py`

**Input to LLM:**
- Current alert data
- Last 5 raw log entries
- Past similar incidents from Supabase (if any)

**Returns:**
```json
{
  "probable_cause": "Deployment at 14:28 introduced a memory leak in payment-service",
  "confidence": "high",
  "affected_service": "payment-service",
  "incident_type": "deployment",
  "recommended_action": "Rollback payment-service to previous stable version",
  "needs_escalation": true,
  "reasoning": "Error rate spiked 4 minutes after deployment timestamp. Memory usage climbing linearly. Pattern matches 2 previous incidents both resolved by rollback."
}
```

**Incident types:** `deployment` | `traffic_spike` | `memory_leak` | `dependency_failure` | `unknown`

---

### Component 5 — Memory Store
**File:** `memory_store.py`  
**Job:** All Supabase read/write operations.  
**Uses:** `supabase-py` library

**Functions:**

| Function | Description |
|---|---|
| `save_incident(alert, rca_result)` | Merge and save to incidents table |
| `get_past_incidents(service, limit=5)` | Fetch last 5 for a service |
| `get_all_incidents(limit=20)` | Fetch last 20 for dashboard |

---

### Component 6 — Action Executor
**File:** `action_executor.py`  
**Job:** Take response actions after RCA completes.  
**Uses:** `call_llm()` for drafting, then external APIs for execution.

**Function 1: `create_github_issue(alert, rca_result)`**
- LLM drafts structured issue content
- PyGithub creates the issue in the repo
- Returns issue URL

**Function 2: `send_slack_alert(alert, rca_result, github_url)`**
- LLM drafts concise Slack message (max 80 words)
- Sent via Slack Incoming Webhook
- Returns True if successful

---

### Component 7 — Main Orchestrator
**File:** `agent.py`  
**Job:** Wire all components into a LangGraph StateGraph.  
**Handles:** `LLMUnavailableError` gracefully — logs and ends pipeline without crashing.

**State:** TypedDict containing current alert, noise filter result, past incidents, RCA result, and action results passed between nodes.

---

### Component 8 — Dashboard
**File:** Next.js — `app/page.js`  
**Job:** Display real-time incident feed from Supabase.  
**Theme:** Dark (black/dark grey)

**UI Sections:**

| Section | Content |
|---|---|
| Header | "Project Pulse — AIOps Dashboard" |
| Stats row | Total Incidents · P1 Count · Services Affected |
| Incident cards | Newest first, full incident detail |

**Per card:**
- Service name + severity badge (P1 = red, P2 = yellow)
- Incident type tag
- Probable cause (bold)
- Reasoning (collapsed by default, expand on click)
- Recommended action
- Timestamp
- Red escalation banner if `needs_escalation = true`

---

## 9. LLM Fallback Architecture

This is a deliberate architectural decision, not a workaround. All AI calls route through a single `llm_client.py` module.

```
call_llm(system_prompt, user_message)
          │
          ▼
    Try Groq API
    llama-3.3-70b-versatile
    temperature=0, max_tokens=1000
          │
    Success? ──────────────────▶ Return response
          │ Any exception
          ▼
    Log: "Groq failed: {error}. Switching to Gemini."
          │
          ▼
    Try Gemini 2.5 Flash
    google-generativeai SDK
          │
    Success? ──────────────────▶ Return response
          │ Any exception
          ▼
    Raise LLMUnavailableError
    "Both Groq and Gemini failed. Last error: {error}"
```

**Why temperature=0:** All prompts expect structured JSON output. Temperature 0 gives deterministic, consistent formatting — critical for downstream JSON parsing.

**Why this matters for CV:** Automatic LLM fallback is a real production pattern. Most juniors don't know it exists. Interviewers will ask about it.

---

## 10. Prompt Engineering Strategy

All prompts follow these principles:

**1. One job per prompt.** Each prompt has a single, clearly defined output. No multi-tasking.

**2. Structured JSON output contract.** Every Claude-facing node outputs strict JSON. LangGraph routes based on fields (`needs_escalation`, `is_real_incident`, `confidence`). No regex parsing needed.

**3. Safety biases baked in.** Noise filter defaults to real if unsure. RCA defaults to recommending human review for unknown incident types.

**4. Temperature 0.** All prompts use temperature=0 for consistent, parseable outputs.

**5. Minimal context, maximum signal.** Each prompt receives only what it needs — current alert, relevant logs, and past incidents. No noise in the context window.

### Prompt Nodes Summary

| Node | Prompt Job | Key Output Field |
|---|---|---|
| Noise Filter | Real or noise decision | `is_real_incident` (bool) |
| RCA Agent | Root cause + action | `needs_escalation` (bool), `incident_type` |
| GitHub Issue Drafter | Structured issue content | Title + body sections |
| Slack Message Drafter | Concise alert message | 80-word Slack message |

---

## 11. Data Schema

### Supabase — `incidents` table

```sql
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('P1', 'P2')),
  triggered_at TIMESTAMPTZ NOT NULL,
  probable_cause TEXT,
  confidence TEXT,
  incident_type TEXT,
  recommended_action TEXT,
  needs_escalation BOOLEAN DEFAULT FALSE,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Environment Variables

```bash
# LLM — Primary
GROQ_API_KEY=your_groq_api_key

# LLM — Fallback
GEMINI_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=yourusername/yourreponame

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

Python backend: `.env` file, loaded with `python-dotenv`  
Next.js dashboard: `.env.local` file

---

## 13. Scope — In & Out

### In Scope ✅

- Mock log and metrics ingestion (JSON files)
- Threshold-based anomaly detection (rule engine)
- LLM-powered noise filtering
- LLM-powered root cause analysis with memory
- Automatic LLM fallback (Groq → Gemini)
- Incident memory via Supabase
- GitHub issue auto-creation via GitHub MCP
- Slack alert via Slack MCP
- Human-in-the-loop escalation flag (no auto-send)
- Incident history dashboard (Next.js)

### Out of Scope ❌

- Real server monitoring (not needed for demo)
- Auto-rollback or destructive actions
- Multi-tenant architecture or user authentication
- Mobile app or native client
- Paid tier / subscription logic
- CI/CD pipeline integration
- On-call scheduling or rotation management

---

## 14. Build Timeline

| Day | Components | Goal |
|---|---|---|
| Day 1 | Component 1 + 2 | Mock data flowing, anomalies detected, no LLM yet |
| Day 2 | Component 0 | LLM client working, test Groq → Gemini fallback manually |
| Day 3 | Component 3 | Noise filter running, first real LLM call end-to-end |
| Day 4 | Component 4 + 5 | RCA agent working, Supabase saving and retrieving |
| Day 5 | Component 6 | GitHub issue created, Slack message sent |
| Day 6 | Component 7 | Full LangGraph pipeline wired, end-to-end test |
| Day 7 | Component 8 | Dashboard live, pulling from Supabase |
| Day 8 | — | Full loop test, fix breaks, polish demo |

**Rule:** Test each component in isolation before moving to the next. If something breaks, paste the exact error back into Antigravity with "fix only this error, don't rewrite anything else."

---

## 15. CV & Portfolio Notes

### CV Line

> **Project Pulse — AIOps Incident Response Agent**  
> Autonomous agent that monitors system metrics, performs root cause analysis, and executes response actions (GitHub issue creation, Slack alerts, human-in-the-loop escalation) via MCP tool calling. Features automatic LLM fallback architecture (Groq llama-3.3-70b → Gemini 2.5 Flash). Built with LangGraph, Groq API, Gemini API, Supabase, and GitHub/Slack MCP integrations.

### What to Say in Interviews

**On architecture:**
> "I started with problem decomposition — broke the incident response loop into 8 independent components. Each LLM-facing node has a structured JSON output contract so LangGraph can route between nodes based on response fields without any regex parsing."

**On the fallback system:**
> "All AI calls route through a shared LLM client. Groq runs first — if it raises any exception, Gemini activates automatically. If both fail, the pipeline ends gracefully without crashing. This is a standard production pattern for LLM reliability."

**On why mock data:**
> "The agent logic is the same regardless of whether logs come from a real server or a JSON file. The architectural patterns — multi-step agents, tool calling, memory, fallback — are what matter for the role."

### Skills Demonstrated

| Skill | How It Shows |
|---|---|
| LLM Orchestration | LangGraph multi-node StateGraph |
| Prompt Engineering | Structured JSON contracts, safety biases, temperature control |
| Problem Decomposition | 8 independent components, one job per module |
| Tool Calling | GitHub MCP + Slack MCP integration |
| Memory Architecture | Supabase past incident retrieval as LLM context |
| Production Patterns | LLM fallback, human-in-the-loop, graceful error handling |
| Full Stack | Python backend + Next.js dashboard |

---

*PRD Version 1.0 — DraftOps — Vipul Padwal — May 2026*
