import os
import django
import sys

# Set up Django environment
sys.path.append('c:/Users/user/Documents/workspace/markwave_HR/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Attendance, AttendanceLogs
from datetime import datetime, timedelta

def debug_attendance():
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today_str = india_time.strftime('%Y-%m-%d')
    
    print(f"--- Debugging Attendance for {today_str} ---")
    
    # Get last 10 logs overall
    print("\nLast 10 Attendance Logs:")
    logs = AttendanceLogs.objects.all().order_by('-id')[:10]
    for log in logs:
        print(f"ID: {log.id}, Emp: {log.employee.employee_id if log.employee else 'N/A'}, Time: {log.timestamp}, Type: {log.type}, Date: {log.date}")

    # Get last 5 summaries overall
    print("\nLast 5 Attendance Summaries:")
    summaries = Attendance.objects.all().order_by('-id')[:5]
    for s in summaries:
        print(f"ID: {s.id}, Emp: {s.employee.employee_id if s.employee else 'N/A'}, Date: {s.date}, In: {s.check_in}, Out: {s.check_out}, Status: {s.status}")

if __name__ == "__main__":
    debug_attendance()
