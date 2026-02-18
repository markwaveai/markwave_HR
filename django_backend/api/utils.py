import re
import requests
import json

from django.conf import settings

def normalize_phone(phone_str):
    if not phone_str:
        return ""
    digits = re.sub(r'\D', '', str(phone_str))
    if len(digits) == 12 and digits.startswith('91'):
        return digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        return digits[1:]
    return digits


def send_email_via_api(to_email, subject, body, cc_emails=None):
    url = settings.EMAIL_API_URL
    
    if cc_emails is None:
        cc_emails = []
    
    payload = {
        "subject": subject,
        "msgbody": body,
        "to_emails": [to_email.strip() if to_email else ""],
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


def create_whatsapp_group(group_name, participants):
    print("=== WhatsApp Group Creation Debug ===")
    
    url = settings.PERISKOPE_CREATE_GROUP_URL
    
    formatted_participants = []
    for p in participants:
        clean_number = normalize_phone(p)
        if clean_number:
            formatted_participants.append(f"91{clean_number}")
    
    print(f"Original Participants: {participants}")
    print(f"Formatted Participants: {formatted_participants}")
            
    payload = {
        "group_name": group_name,
        "participants": formatted_participants,
    }
    
    headers = {
        "Authorization": f"Bearer {settings.PERISKOPE_API_KEY}",
        "Content-Type": "application/json",
        "x-phone": settings.PERISKOPE_SENDER_PHONE
    }
    
    print(f"Request URL: {url}")
    print(f"Request Headers (x-phone): {headers.get('x-phone')}")
    print(f"Request Payload: {json.dumps(payload)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Response Status: {response.status_code}")
        print(f"Body: {response.text}")
        
        if response.status_code in [200, 201]:
            resp_data = response.json()
            # Extract chat_id from response
            chat_id = resp_data.get('chat_id') or resp_data.get('id')
            if not chat_id and 'chat' in resp_data:
                chat_id = resp_data['chat'].get('id')
                
            invite_link = resp_data.get('invite_link')
            if not invite_link and 'chat' in resp_data:
                invite_link = resp_data['chat'].get('invite_link')
                
            return True, {'chat_id': chat_id, 'invite_link': invite_link, 'data': resp_data}
        else:
            return False, response.text
            
    except requests.exceptions.RequestException as e:
        print(f"Exception creating WhatsApp group: {e}")
        return False, str(e)

def add_whatsapp_participant(chat_id, phone_number):
    """
    Adds a single participant to an existing WhatsApp group via Periskope API.
    Endpoint: POST {{baseUrl}}/chats/:chat_id/add
    """
    print(f"=== Adding WhatsApp Participant: {phone_number} to {chat_id} ===")
    
    if not chat_id:
        return False, "No chat_id provided"
        
    base_url = getattr(settings, 'PERISKOPE_BASE_URL', 'https://api.periskope.app/v1')
    url = f"{base_url}/chats/{chat_id}/add"
    
    clean_number = normalize_phone(phone_number)
    if not clean_number:
        return False, "Invalid phone number"
        
    formatted_participant = f"91{clean_number}"
    
    # Payload structure based on typical Periskope "Add Participant" pattern
    # It might be 'participants' (array) or 'participant' (string)
    # Given the URL structure, let's try 'participants' as an array first
    payload = {
        "participants": [formatted_participant]
    }
    
    headers = {
        "Authorization": f"Bearer {settings.PERISKOPE_API_KEY}",
        "Content-Type": "application/json",
        "x-phone": settings.PERISKOPE_SENDER_PHONE
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Request Payload: {json.dumps(payload)}")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code in [200, 201, 204]:
            return True, response.text
        else:
            return False, response.text
    except Exception as e:
        print(f"Error adding participant: {e}")
        return False, str(e)

def remove_whatsapp_participant(chat_id, phone_number):
    """
    Removes a single participant from a WhatsApp group via Periskope API.
    Endpoint: POST {{baseUrl}}/chats/:chat_id/remove
    """
    print(f"=== Removing WhatsApp Participant: {phone_number} from {chat_id} ===")
    
    if not chat_id:
        return False, "No chat_id provided"
        
    base_url = getattr(settings, 'PERISKOPE_BASE_URL', 'https://api.periskope.app/v1')
    url = f"{base_url}/chats/{chat_id}/remove"
    
    clean_number = normalize_phone(phone_number)
    if not clean_number:
        return False, "Invalid phone number"
        
    formatted_participant = f"91{clean_number}"
    
    payload = {
        "participants": [formatted_participant]
    }
    
    headers = {
        "Authorization": f"Bearer {settings.PERISKOPE_API_KEY}",
        "Content-Type": "application/json",
        "x-phone": settings.PERISKOPE_SENDER_PHONE
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Request Payload: {json.dumps(payload)}")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code in [200, 201, 204]:
            return True, response.text
        else:
            return False, response.text
    except Exception as e:
        print(f"Error removing participant: {e}")
        return False, str(e)


