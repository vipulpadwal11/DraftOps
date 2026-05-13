import os
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="DraftOps Ingest API")

LOG_FILE = "live_logs.json"

class LogEntry(BaseModel):
    project_id: str
    service: str
    level: str
    message: str
    cpu_usage: Optional[float] = 0
    memory_usage: Optional[float] = 0
    error_rate: Optional[float] = 0
    latency_ms: Optional[float] = 0

def get_all_logs() -> List[dict]:
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_all_logs(logs: List[dict]):
    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=2)

@app.post("/ingest")
async def ingest_log(entry: LogEntry):
    log_dict = entry.model_dump()
    log_dict["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    logs = get_all_logs()
    logs.append(log_dict)
    save_all_logs(logs)
    
    return {"status": "received"}

@app.get("/logs/{project_id}")
async def get_project_logs(project_id: str):
    logs = get_all_logs()
    project_logs = [log for log in logs if log.get("project_id") == project_id]
    return project_logs[-20:]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
