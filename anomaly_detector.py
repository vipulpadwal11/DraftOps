import json

def run_detector(source_file="mock_logs.json"):
    try:
        with open(source_file, "r") as f:
            logs = json.load(f)
    except FileNotFoundError:
        return []

    services = {}
    for log in logs:
        services.setdefault(log["service"], []).append(log)

    alerts = []

    for service, s_logs in services.items():
        s_logs.sort(key=lambda x: x["timestamp"])
        
        triggered_rules = []
        first_trigger_ts = None
        
        def update_ts(ts):
            nonlocal first_trigger_ts
            if first_trigger_ts is None or ts < first_trigger_ts:
                first_trigger_ts = ts

        # cpu_usage > 85 for 3+ consecutive
        consecutive_cpu = 0
        for log in s_logs:
            if log["cpu_usage"] > 85:
                consecutive_cpu += 1
                if consecutive_cpu == 3:
                    triggered_rules.append("cpu")
                    update_ts(log["timestamp"])
            else:
                consecutive_cpu = 0

        # error_rate > 20
        for log in s_logs:
            if log["error_rate"] > 20:
                triggered_rules.append("error_rate")
                update_ts(log["timestamp"])
                break

        # latency_ms > 1500
        for log in s_logs:
            if log["latency_ms"] > 1500:
                triggered_rules.append("latency")
                update_ts(log["timestamp"])
                break

        # 3 or more ERROR in last 10
        last_10 = s_logs[-10:]
        error_logs = [log for log in last_10 if log["level"] == "ERROR"]
        if len(error_logs) >= 3:
            triggered_rules.append("error_count")
            update_ts(error_logs[0]["timestamp"])

        if triggered_rules:
            severity = "P1" if len(triggered_rules) >= 2 else "P2"
            alerts.append({
                "service": service,
                "alert_type": ", ".join(triggered_rules),
                "severity": severity,
                "triggered_at": first_trigger_ts if first_trigger_ts else s_logs[-1]["timestamp"],
                "raw_logs": s_logs[-5:]
            })

    return alerts

if __name__ == "__main__":
    alerts = run_detector()
    print(json.dumps(alerts, indent=2))
