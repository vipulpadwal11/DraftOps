import json
import random
from datetime import datetime, timedelta

# SIMULATE_INCIDENT = True: payment-service degrades in the last 15 entries
# SIMULATE_INCIDENT = False: all services remain healthy
SIMULATE_INCIDENT = True

SERVICES = ["auth-service", "payment-service", "api-gateway"]
LEVELS = ["INFO", "WARN", "ERROR"]

def generate_logs():
    logs = []
    base_time = datetime.now() - timedelta(minutes=50)
    
    for i in range(50):
        timestamp = (base_time + timedelta(minutes=i)).isoformat()
        service = random.choice(SERVICES)
        
        # Default Healthy Metrics
        level = "INFO"
        cpu_usage = random.uniform(15, 35)
        memory_usage = random.uniform(20, 45)
        error_rate = random.uniform(0, 1.5)
        latency_ms = random.randint(40, 120)
        message = f"Service {service} heartbeat: all systems operational."

        # Simulate Incident for payment-service in the last 15 logs
        if SIMULATE_INCIDENT and service == "payment-service" and i >= 35:
            # Gradual degradation based on how close to the end we are
            severity_factor = (i - 34) / 15.0
            level = random.choices(["WARN", "ERROR"], weights=[0.4, 0.6])[0]
            cpu_usage = 40 + (55 * severity_factor) + random.uniform(0, 5)
            memory_usage = 50 + (40 * severity_factor) + random.uniform(0, 5)
            error_rate = 10 + (80 * severity_factor) + random.uniform(0, 10)
            latency_ms = 500 + int(2000 * severity_factor) + random.randint(0, 100)
            
            messages = [
                "Connection timeout in payment processing queue.",
                "Database pool exhaustion detected.",
                "Failed to process transaction: internal server error.",
                "High latency detected in downstream provider API."
            ]
            message = random.choice(messages)

        logs.append({
            "timestamp": timestamp,
            "service": service,
            "level": level,
            "message": message,
            "cpu_usage": round(cpu_usage, 2),
            "memory_usage": round(memory_usage, 2),
            "error_rate": round(error_rate, 2),
            "latency_ms": latency_ms
        })

    with open("mock_logs.json", "w") as f:
        json.dump(logs, f, indent=2)

if __name__ == "__main__":
    generate_logs()
    print("Successfully generated 50 logs to 'mock_logs.json'.")
