import os
import django
import sys
import threading

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "keka_server.settings")
django.setup()

from core.models import Leaves, Employees
from api.leave_views import notify_employee_status_update

def test_email_notification():
    print("--- Searching for a recent Approved leave request ---")
    # Find a recent approved leave request
    leave = Leaves.objects.filter(status='Approved').order_by('-created_at').first()
    
    if not leave:
        print("No approved leave requests found to test.")
        # Try to find ANY leave request to test with
        leave = Leaves.objects.all().order_by('-created_at').first()
        if leave:
            print(f"Using Pending/Rejected request {leave.id} for testing instead.")
        else:
            print("No leave requests found at all.")
            return

    print(f"Testing notification for Leave ID: {leave.id}")
    print(f"Employee: {leave.employee.first_name} {leave.employee.last_name}")
    print(f"Email: {leave.employee.email}")
    print(f"Status: {leave.status}")

    if not leave.employee.email:
        print("ERROR: Employee has no email address.")
        return

    print("--- calling notify_employee_status_update synchronously ---")
    notify_employee_status_update(leave.id)
    print("--- Done ---")

if __name__ == "__main__":
    test_email_notification()
