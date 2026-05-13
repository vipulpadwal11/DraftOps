import os
import time
import json
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv
from apscheduler.schedulers.blocking import BlockingScheduler

load_dotenv()

from anomaly_detector import run_detector
from noise_filter import filter_noise
from rca_agent import run_rca
from memory_store import save_incident, get_past_incidents
from action_executor import create_github_issue, send_slack_alert
from llm_client import LLMUnavailableError

class AgentState(TypedDict):
    alerts: List[Dict[str, Any]]
    current_alert: Optional[Dict[str, Any]]
    noise_result: Optional[Dict[str, Any]]
    past_incidents: List[Dict[str, Any]]
    rca_result: Optional[Dict[str, Any]]
    github_url: Optional[str]
    pipeline_stopped: bool

def node_detect_anomalies(state: AgentState):
    log_source = os.getenv("LOG_SOURCE", "mock")
    source_file = "live_logs.json" if log_source == "live" else "mock_logs.json"
    
    print(f"Reading from: {source_file}")
    
    # Get log count for debugging
    try:
        if os.path.exists(source_file):
            with open(source_file, "r") as f:
                logs_data = json.load(f)
                print(f"Total logs found: {len(logs_data)}")
        else:
            print(f"Total logs found: 0 (File does not exist)")
    except Exception as e:
        print(f"Error reading log count: {e}")

    alerts = run_detector(source_file=source_file)
    print(f"Alerts found: {len(alerts)}")
    
    if not alerts:
        return {"pipeline_stopped": True}
    return {
        "alerts": alerts,
        "current_alert": alerts[0],
        "pipeline_stopped": False
    }

def node_filter_noise(state: AgentState):
    alert = state.get("current_alert")
    if not alert:
        return {"pipeline_stopped": True}
        
    noise_result = filter_noise(alert)
    is_real = noise_result.get("is_real_incident", False)
    
    return {
        "noise_result": noise_result,
        "pipeline_stopped": not is_real
    }

def node_fetch_memory(state: AgentState):
    alert = state["current_alert"]
    past_incidents = get_past_incidents(alert["service"])
    return {"past_incidents": past_incidents}

def node_run_rca(state: AgentState):
    alert = state["current_alert"]
    past_incidents = state.get("past_incidents", [])
    rca_result = run_rca(alert, past_incidents)
    
    save_incident(alert, rca_result)
    
    return {"rca_result": rca_result}

def node_execute_actions(state: AgentState):
    alert = state["current_alert"]
    rca_result = state["rca_result"]
    
    github_url = create_github_issue(alert, rca_result)
    send_slack_alert(alert, rca_result, github_url)
    
    if rca_result.get("needs_escalation") is True:
        print("ESCALATION REQUIRED - Human decision needed")
        print(f"Service: {alert.get('service')}")
        print(f"Cause: {rca_result.get('probable_cause')}")
        
    return {"github_url": github_url}

def route_after_detect(state: AgentState):
    if state.get("pipeline_stopped"):
        return END
    return "filter_noise"

def route_after_filter(state: AgentState):
    if state.get("pipeline_stopped"):
        return END
    return "fetch_memory"

builder = StateGraph(AgentState)

builder.add_node("detect_anomalies", node_detect_anomalies)
builder.add_node("filter_noise", node_filter_noise)
builder.add_node("fetch_memory", node_fetch_memory)
builder.add_node("run_rca", node_run_rca)
builder.add_node("execute_actions", node_execute_actions)

builder.add_edge(START, "detect_anomalies")
builder.add_conditional_edges("detect_anomalies", route_after_detect)
builder.add_conditional_edges("filter_noise", route_after_filter)
builder.add_edge("fetch_memory", "run_rca")
builder.add_edge("run_rca", "execute_actions")
builder.add_edge("execute_actions", END)

graph = builder.compile()

def run_pipeline():
    print(f"\n--- Starting Pipeline Run at {time.strftime('%H:%M:%S')} ---")
    initial_state = {
        "alerts": [],
        "current_alert": None,
        "noise_result": None,
        "past_incidents": [],
        "rca_result": None,
        "github_url": None,
        "pipeline_stopped": False
    }
    
    try:
        graph.invoke(initial_state)
        print("Pipeline run complete.")
    except LLMUnavailableError:
        print("LLM unavailable. Pipeline stopped.")
    except Exception as e:
        print(f"Pipeline error: {e}")

if __name__ == "__main__":
    import sys
    
    if "--scheduled" in sys.argv:
        print("Starting Agent in SCHEDULED mode (every 2 minutes)...")
        scheduler = BlockingScheduler()
        # Run once immediately
        run_pipeline()
        # Schedule every 2 minutes
        scheduler.add_job(run_pipeline, 'interval', minutes=2)
        try:
            scheduler.start()
        except (KeyboardInterrupt, SystemExit):
            pass
    else:
        print("Starting Agent in MANUAL mode...")
        run_pipeline()
