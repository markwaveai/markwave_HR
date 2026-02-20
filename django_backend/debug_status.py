import os
import django
import sys
import datetime
from datetime import timedelta

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, Attendance, AttendanceLogs, Leaves, Holidays
from rest_framework.test import APIRequestFactory

def debug_get_status(employee_id):
    print(f"DEBUGGING get_status for {employee_id}")
    try:
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        if not employee:
            print("Employee not found")
            return

        print(f"Found Employee: {employee.first_name} {employee.last_name} ({employee.employee_id})")

        now = datetime.datetime.utcnow() + timedelta(hours=5, minutes=30)
        current_date_str = now.strftime('%Y-%m-%d')
        print(f"Current Date: {current_date_str}")
        
        # Check for holiday
        holiday_obj = Holidays.objects.filter(date=current_date_str).first()
        is_holiday_db = holiday_obj is not None
        print(f"Is Holiday DB: {is_holiday_db}")

        attendance_record = Attendance.objects.filter(
            employee=employee,
            date=current_date_str
        ).first()
        print(f"Attendance Record: {attendance_record}")
        
        is_holiday = is_holiday_db or (attendance_record and attendance_record.is_holiday)
        
        # Check for approved leave
        is_on_leave = Leaves.objects.filter(
            employee=employee,
            status__iexact='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).exists()
        print(f"Is On Leave: {is_on_leave}")

        # Logs
        last_log = AttendanceLogs.objects.filter(employee=employee).order_by('-timestamp').first()
        print(f"Last Log: {last_log}")

        print("DEBUG SUCCESS: No exceptions during logical checks.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    # Test with ID 55 (Pavani)
    print("Testing with ID 55:")
    debug_get_status("55")
    print("\nTesting with EmployeeID MW-PAVANI:")
    debug_get_status("MW-PAVANI")
