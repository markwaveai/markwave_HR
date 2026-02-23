import requests
import json

def test_static_login():
    url = "http://localhost:8000/api/auth/login/"
    payload = {
        "email": "demo@gmail.com",
        "password": "Demo@123"
    }
    headers = {
        "Content-Type": "application/json"
    }

    print(f"Testing static login at {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200 and response.json().get('success'):
            print("\nSUCCESS: Static login is working correctly.")
        else:
            print("\nFAILURE: Static login failed.")
            
    except Exception as e:
        print(f"\nERROR: Could not connect to API. {e}")
        print("Note: Ensure the server 'python manage.py runserver 0.0.0.0:8000' is actually reachable.")

if __name__ == "__main__":
    test_static_login()
