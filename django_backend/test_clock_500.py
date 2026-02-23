import os
import sys
import django

# Add the project dir to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from django.test import RequestFactory
from api.attendance_views import clock
from core.models import Employees, Leaves
from datetime import datetime

# Create a test employee
emp, _ = Employees.objects.get_or_create(employee_id='TEST001', defaults={'first_name': 'Test', 'email': 'test@example.com'})
date_str = datetime.now().strftime('%Y-%m-%d')

# Ensure they are on leave today
leave, created = Leaves.objects.get_or_create(
    employee=emp, 
    from_date=date_str, 
    to_date=date_str, 
    defaults={'type': 'CL', 'days': 1.0, 'status': 'Approved', 'is_overridden': False}
)
if not created:
    leave.status = 'Approved'
    leave.is_overridden = False
    leave.save()

# employee_id TEST001 is now on leave
factory = RequestFactory()
request = factory.post('/api/attendance/clock/', {'employee_id': 'TEST001', 'location': 'Test', 'type': 'IN'}, content_type='application/json')
response = clock(request)
print("Status code:", response.status_code)
if response.status_code == 500:
    print(response.data)

