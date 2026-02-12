import requests
import json

url = 'http://127.0.0.1:8000/api/auth/profile/MWI005/'

try:
    print(f"Fetching profile from: {url}")
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print("--- API RESPONSE START ---")
        print(f"ID: {data.get('id')}")
        print(f"Employee ID: {data.get('employee_id')}")
        print(f"Email: '{data.get('email', '-')}'")
        print(f"Contact: '{data.get('contact', '-')}'")
        print(f"Location: '{data.get('location', '-')}'")
        print(f"Aadhar: '{data.get('aadhar', '-')}'")
        print(f"Joining Date: '{data.get('joining_date', '-')}'")
        print("--- API RESPONSE END ---")
    else:
        print(f"Failed with status: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
