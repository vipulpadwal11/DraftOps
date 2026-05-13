import json
from llm_client import call_llm

def run_rca(alert, past_incidents):
    # Exclude raw logs from the alert dict for Section 1 to prevent duplication
    alert_info = {k: v for k, v in alert.items() if k != "raw_logs"}
    raw_logs = alert.get("raw_logs", [])
    
    section_1 = f"CURRENT ALERT:\n{json.dumps(alert_info, indent=2)}"
    section_2 = f"RAW LOGS (last 5 entries):\n{json.dumps(raw_logs, indent=2)}"
    
    if past_incidents:
        section_3 = f"PAST INCIDENTS (historical context):\n{json.dumps(past_incidents, indent=2)}"
    else:
        section_3 = "PAST INCIDENTS (historical context):\nNone"
        
    user_message = f"{section_1}\n\n{section_2}\n\n{section_3}"
    
    system_prompt = """You are a senior site reliability engineer doing 
root cause analysis. Be technical and precise.

Respond ONLY in this exact JSON with no other text:
{
  "probable_cause": "one clear sentence",
  "confidence": "high or medium or low",
  "affected_service": "service name",
  "incident_type": "deployment or traffic_spike or memory_leak or dependency_failure or unknown",
  "recommended_action": "one concrete action",
  "needs_escalation": true or false,
  "reasoning": "3-5 sentences of technical analysis"
}"""

    response_text = call_llm(system_prompt, user_message)
    
    try:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end != 0:
            return json.loads(response_text[start:end])
        else:
            raise ValueError("No JSON object found")
    except Exception:
        raise ValueError(f"RCA parse failed: {response_text}")

if __name__ == "__main__":
    from anomaly_detector import run_detector
    from noise_filter import filter_noise
    from memory_store import get_past_incidents
    
    print("Detecting anomalies...")
    alerts = run_detector()
    
    if alerts:
        first_alert = alerts[0]
        print(f"Anomaly detected in {first_alert['service']}. Running noise filter...")
        
        noise_result = filter_noise(first_alert)
        
        if noise_result.get("is_real_incident"):
            print("Alert is a real incident. Fetching past incidents...")
            past_incidents = get_past_incidents(first_alert["service"])
            
            print("Running RCA...")
            rca_result = run_rca(first_alert, past_incidents)
            
            print("\nFinal RCA Result:")
            print(json.dumps(rca_result, indent=2))
        else:
            print("Alert was classified as noise.")
    else:
        print("No alerts found.")
