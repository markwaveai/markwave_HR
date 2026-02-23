import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from api.views import login
from core.models import Employees
from rest_framework.test import APIRequestFactory
from rest_framework import status

def test_static_login_orm():
    factory = APIRequestFactory()
    data = {
        "email": "demo@gmail.com",
        "password": "Demo@123"
    }
    request = factory.post('/api/auth/login/', data, format='json')
    
    print(f"Testing static login via ORM with {data}...")
    try:
        response = login(request)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Response Body:")
            print(response.data)
            
            # Verify user exists in DB
            emp = Employees.objects.filter(email='demo@gmail.com').first()
            if emp:
                print(f"SUCCESS: Demo user found in database (ID: {emp.id})")
            else:
                print("FAILURE: Demo user not found in database after login.")
        else:
            print(f"FAILURE: Unexpected status code {response.status_code}")
            print(f"Error: {response.data}")
            
    except Exception as e:
        print(f"ORM Test Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_static_login_orm()
