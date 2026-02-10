import requests
import json

URL = "http://hr.markwave.ai:8000/api/auth/send-otp/"

def test_payload(name, payload):
    print(f"\n--- Testing {name} ---")
    print(f"Payload: {json.dumps(payload)}")
    try:
        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'}, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# 1. Valid Phone
test_payload("Normal Phone", {"phone": "9876543210"})

# 2. Phone with spaces
test_payload("Phone with spaces", {"phone": " 9876543210 "})

# 3. Missing Phone
test_payload("Missing Phone", {})

# 4. Wrong Key
test_payload("Wrong Key", {"mobile": "9876543210"})

# 5. String spaces (empty)
test_payload("Empty String Phone", {"phone": ""})
