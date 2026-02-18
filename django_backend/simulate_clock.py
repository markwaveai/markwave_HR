import os
import django
import sys

# Set up Django environment
sys.path.insert(0, 'c:/Users/user/Documents/workspace/markwave_HR/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from api.attendance_views import clock

def simulate_clock_out(employee_id_str):
    print(f"--- Simulating Clock-Out for {employee_id_str} ---")
    
    factory = APIRequestFactory()
    data = {
        'employee_id': employee_id_str,
        'location': 'Debug Simulation',
        'type': 'OUT'
    }
    request = factory.post('/attendance/clock/', data, format='json')
    
    try:
        # We need to pass the underlying request to the api_view wrapper
        response = clock(request)
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {response.data}")
    except Exception as e:
        import traceback
        print(f"Exception occurred: {e}")
        print(traceback.format_exc())

if __name__ == "__main__":
    simulate_clock_out('MWI005')
