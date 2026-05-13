import os
import json
from datetime import datetime, timezone
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
from memory_store import supabase

load_dotenv()

app = FastAPI(title="DraftOps Ingest API")

class LogEntry(BaseModel):
    project_id: str
    service: str
    level: str
    message: str
    cpu_usage: float = 0
    memory_usage: float = 0
    error_rate: float = 0
    latency_ms: float = 0

@app.post("/ingest")
async def ingest_log(entry: LogEntry):
    log_dict = entry.model_dump()
    log_dict["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    # Save to Supabase instead of JSON file
    try:
        supabase.table("live_logs").insert(log_dict).execute()
        return {"status": "received", "storage": "supabase"}
    except Exception as e:
        print(f"Failed to save log to Supabase: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/logs/{project_id}")
async def get_project_logs(project_id: str):
    # Fetch from Supabase
    try:
        response = supabase.table("live_logs").select("*").eq("project_id", project_id).order("created_at", desc=True).limit(20).execute()
        return response.data
    except Exception:
        return []

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
