import json
from llm_client import call_llm
from anomaly_detector import detect_anomalies

def filter_noise(alert):
    system_prompt = """You are an alert triage system. Your only job is to 
decide if an alert is real or noise. Be conservative — 
if unsure, call it real. Never miss a real incident.

Respond ONLY in this exact JSON with no other text:
{
  "is_real_incident": true or false,
  "confidence": "high" or "medium" or "low",
  "reason": "one sentence explanation"
}"""

    user_message = f"Please analyze this alert:\n{json.dumps(alert, indent=2)}"

    try:
        response_text = call_llm(system_prompt, user_message)
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end != 0:
            return json.loads(response_text[start:end])
        else:
            raise ValueError("No JSON object found")
    except Exception:
        return {
            "is_real_incident": True,
            "confidence": "low",
            "reason": "parse failed, defaulting to real"
        }

if __name__ == "__main__":
    alerts = detect_anomalies()
    if alerts:
        first_alert = alerts[0]
        result = filter_noise(first_alert)
        print(json.dumps(result, indent=2))
    else:
        print("No alerts found to filter.")
