import base64

from fastapi import APIRouter, Depends, HTTPException, status, Request

from sqlalchemy.orm import Session
import requests

from ..config import settings
from ..database import get_db


"""
Create endpoints for Jira integration.
We have a project created in the system.
When a user fills out a form and submits feedback, 
we need to send this feedback to Jira by creating a ticket in Jira.

There are three categories: bug, task, and story. 
Tickets can be created using the Jira API, 
and based on the type of feedback the user sends, 
the ticket will be categorized as a bug, story, or task.

1. Method to create a Jira ticket globally.
2. Method to fetch a list of categories from Jira to choose the appropriate one.
3. Method to add a ticket to a specific category in Jira by sending the ticket data.
"""

router = APIRouter(prefix="/v1/jira", tags=["Jira Integration"])


# Common function for Jira API requests
def jira_request(method: str, endpoint: str, payload=None):
    url = f"{settings.jira_base_url}/rest/api/3/{endpoint}"
    auth_header = f"{settings.jira_email}:{settings.jira_api_token}".encode("utf-8")
    headers = {
        "Authorization": f"Basic {base64.b64encode(auth_header).decode()}",
        "Content-Type": "application/json",
    }
    response = requests.request(method, url, headers=headers, json=payload)
    if not response.ok:
        raise HTTPException(
            status_code=response.status_code, detail=f"Jira API error: {response.text}"
        )
    return response.json()


# Method 1: Global method to create a Jira ticket
def create_jira_ticket(summary: str, description: str, issue_type: str):
    payload = {
        "fields": {
            "project": {"key": settings.jira_project_key},
            "summary": summary,
            "description": description,
            "issuetype": {"name": issue_type},
        }
    }
    return jira_request("POST", "issue", payload)


# Method 2: Fetching a list of task types from Jira
@router.get("/categories")
def get_jira_categories():
    response = jira_request("GET", "issuetype")
    return [{"id": item["id"], "name": item["name"]} for item in response]


# Method 3: Creating a ticket based on user feedback
@router.post("/create-ticket")
def handle_feedback(
    feedback: str,
    category: str,  # "bug", "task", "story"
    db: Session = Depends(get_db),
):
    # Determine the type of task based on the category
    issue_type_map = {
        "bug": "Bug",
        "task": "Task",
        "story": "Story",
    }
    issue_type = issue_type_map.get(category.lower())
    if not issue_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category: {category}",
        )

    # Create a ticket in Jira
    try:
        ticket = create_jira_ticket(
            summary=f"New Feedback ({category.title()})",
            description=feedback,
            issue_type=issue_type,
        )
        return {"message": "Ticket successfully created", "ticket_key": ticket["key"]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error while creating ticket: {str(e)}",
        )


# Method for testing webhook requests from Jira (optional)
@router.post("/webhook")
def handle_jira_webhook(request: Request, db: Session = Depends(get_db)):
    data = request.json()
    # Logic for processing webhooks from Jira
    return {"message": "Webhook received", "data": data}
