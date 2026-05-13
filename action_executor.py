import os
import json
import requests
from dotenv import load_dotenv
from github import Github
from llm_client import call_llm

load_dotenv()

def create_github_issue(alert, rca_result):
    system_prompt = """Write a GitHub issue for an engineering incident.
Respond in exactly this format:
TITLE: [INCIDENT] {service} — {incident_type}

## Summary
one paragraph

## Root Cause
one paragraph  

## Recommended Action
- bullet points

## Priority
{severity}

Standard markdown only. Technical and concise."""

    alert_info = {k: v for k, v in alert.items() if k != "raw_logs"}
    user_message = f"ALERT:\n{json.dumps(alert_info, indent=2)}\n\nRCA RESULT:\n{json.dumps(rca_result, indent=2)}"

    response_text = call_llm(system_prompt, user_message)
    
    lines = response_text.strip().split('\n')
    title = ""
    body = ""
    
    if lines and lines[0].startswith("TITLE:"):
        title = lines[0].replace("TITLE:", "").strip()
        body = "\n".join(lines[1:]).strip()
    else:
        title = f"[INCIDENT] {alert['service']} - {rca_result.get('incident_type', 'unknown')}"
        body = response_text

    github_token = os.getenv("GITHUB_TOKEN")
    github_repo = os.getenv("GITHUB_REPO")

    if not github_token or not github_repo:
        print("Warning: GITHUB_TOKEN or GITHUB_REPO is missing. Skipping actual API call.")
        return "https://github.com/fake/repo/issues/1"

    g = Github(github_token)
    repo = g.get_repo(github_repo)
    issue = repo.create_issue(title=title, body=body)
    
    return issue.html_url

def send_slack_alert(alert, rca_result, github_url):
    system_prompt = """Write a Slack alert. Max 80 words. Direct, not dramatic.
P1 = 🔴, P2 = 🟡

Format:
{emoji} *[{severity} INCIDENT]* {service}
*Cause:* one line
*Action:* one line
*Issue:* {github_url}

No other text."""

    alert_info = {k: v for k, v in alert.items() if k != "raw_logs"}
    user_message = f"ALERT:\n{json.dumps(alert_info, indent=2)}\n\nRCA RESULT:\n{json.dumps(rca_result, indent=2)}\n\nGITHUB URL: {github_url}"

    slack_message = call_llm(system_prompt, user_message)

    slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    if not slack_webhook_url:
        print("Warning: SLACK_WEBHOOK_URL is missing. Skipping actual API call.")
        try:
            print(f"Generated Slack Message:\n{slack_message}")
        except UnicodeEncodeError:
            print(f"Generated Slack Message (UTF-8 bytes):\n{slack_message.encode('utf-8')}")
        return True

    response = requests.post(slack_webhook_url, json={"text": slack_message})
    return response.status_code == 200
