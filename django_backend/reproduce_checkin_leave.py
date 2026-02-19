import os
import django
import sys
from datetime import datetime
from django.utils import timezone

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, Leaves, Attendance, AttendanceLogs
from rest_framework.test import APIRequestFactory
from api.attendance_views import clock

def reproduce():
    # 1. Create Test Employee
    employee_id = "TEST-999"
    try:
        employee = Employees.objects.get(employee_id=employee_id)
        print(f"Found existing test employee: {employee.first_name}")
    except Employees.DoesNotExist:
        employee = Employees.objects.create(
            employee_id=employee_id,
            first_name="Test",
            last_name="User",
            email="test@example.com",
            role="Employee", # Not Admin
            joining_date=datetime.now().date()
        )
        print(f"Created test employee: {employee.first_name}")

    # 2. Cleanup previous data for today
    today_str = datetime.now().strftime('%Y-%m-%d')
    Leaves.objects.filter(employee=employee, from_date=today_str).delete()
    Attendance.objects.filter(employee=employee, date=today_str).delete()
    AttendanceLogs.objects.filter(employee=employee, date=today_str).delete()
    print("Cleaned up previous test data.")

    # 3. Create Approved Leave for Today
    leave = Leaves.objects.create(
        employee=employee,
        type="CL",
        from_date=today_str,
        to_date=today_str,
        days=1.0,
        status="Approved",
        reason="Test Leave"
    )
    print(f"Created Approved Leave for today: {leave.id}")

    # 4. Attempt to Clock In
    factory = APIRequestFactory()
    data = {
        'employee_id': employee_id,
        'location': 'Test Location',
        'type': 'IN'
    }
    request = factory.post('/api/attendance/clock/', data, format='json')
    response = clock(request)

    print(f"\nClock In Response Status: {response.status_code}")
    # print(f"Clock In Response Data: {response.data}") # Truncated in output tool

    if response.status_code == 200:
        print(f"Clock In Response Data: {response.data}")
        print("\nSUCCESS: Check-in succeeded. Leave override worked.")
        
        # Verify Leave Status
        updated_leave = Leaves.objects.get(id=leave.id)
        print(f"Leave Status: {updated_leave.status}")
        
    elif response.status_code == 400:
        print(f"Clock In Response Data: {response.data}")
        print("\nFAILURE: Check-in blocked.")
    else:
        print(f"\nUNKNOWN: Unexpected response status {response.status_code}")

if __name__ == "__main__":
    reproduce()
