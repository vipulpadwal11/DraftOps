import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

def save_incident(alert, rca_result):
    row = {
        "service": alert["service"],
        "alert_type": alert["alert_type"],
        "severity": alert["severity"],
        "triggered_at": alert["triggered_at"],
        "probable_cause": rca_result["probable_cause"],
        "confidence": rca_result["confidence"],
        "incident_type": rca_result["incident_type"],
        "recommended_action": rca_result["recommended_action"],
        "needs_escalation": rca_result["needs_escalation"],
        "reasoning": rca_result["reasoning"]
    }
    
    response = supabase.table("incidents").insert(row).execute()
    return response.data

def get_past_incidents(service, limit=5):
    response = supabase.table("incidents").select("*").eq("service", service).order("created_at", desc=True).limit(limit).execute()
    return response.data if response.data else []

def get_all_incidents(limit=20):
    response = supabase.table("incidents").select("*").order("created_at", desc=True).limit(limit).execute()
    return response.data if response.data else []

if __name__ == "__main__":
    from datetime import datetime, timezone
    import json
    
    test_alert = {
        "service": "test-service",
        "alert_type": "cpu_spike",
        "severity": "P2",
        "triggered_at": datetime.now(timezone.utc).isoformat()
    }
    
    test_rca = {
        "probable_cause": "Testing database connection",
        "confidence": "high",
        "incident_type": "unknown",
        "recommended_action": "None",
        "needs_escalation": False,
        "reasoning": "Test run"
    }
    
    print("Saving test incident...")
    saved = save_incident(test_alert, test_rca)
    print("Saved:")
    print(json.dumps(saved, indent=2))
    
    print("\nFetching past incidents for test-service...")
    fetched = get_past_incidents("test-service")
    print("Fetched:")
    print(json.dumps(fetched, indent=2))
