import requests
import json

from django.conf import settings

def send_email_via_api(to_email, subject, body, cc_emails=None):
    url = settings.EMAIL_API_URL
    
    if cc_emails is None:
        cc_emails = []
    
    payload = {
        "subject": subject,
        "msgbody": body,
        "to_emails": [to_email],
        "cc_emails": cc_emails
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
        response.raise_for_status()
        return True, response.json()
    except requests.exceptions.RequestException as e:
        return False, str(e)
