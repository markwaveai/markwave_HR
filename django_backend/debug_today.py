import os
import django
import sys

# Set up Django environment
sys.path.append('c:/Users/user/Documents/workspace/markwave_HR/django_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Attendance, AttendanceLogs
from datetime import datetime, timedelta

def debug_today():
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today_str = india_time.strftime('%Y-%m-%d')
    
    print(f"--- Debugging Clock-Outs for {today_str} ---")
    
    # Check for any OUT logs today
    out_logs = AttendanceLogs.objects.filter(date=today_str, type='OUT')
    print(f"Total OUT logs today: {out_logs.count()}")
    for log in out_logs:
        print(f"Log ID: {log.id}, Emp: {log.employee.employee_id}, Time: {log.timestamp}")
        
        # Check corresponding summary
        summary = Attendance.objects.filter(employee=log.employee, date=today_str).first()
        if summary:
            print(f"  Summary ID: {summary.id}, Check-In: {summary.check_in}, Check-Out: {summary.check_out}")
        else:
            print(f"  No summary found for {log.employee.employee_id}")

if __name__ == "__main__":
    debug_today()
