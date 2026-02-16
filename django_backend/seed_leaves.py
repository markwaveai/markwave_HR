import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, LeaveType, EmployeeLeaveBalance
from datetime import datetime

def seed_leave_data():
    # 1. Create Default Leave Types
    leave_types = [
        {'name': 'Casual Leave', 'code': 'CL', 'days_per_year': 12},
        {'name': 'Sick Leave', 'code': 'SL', 'days_per_year': 12},
        {'name': 'Earned Leave', 'code': 'EL', 'days_per_year': 15},
        {'name': 'Special Leave', 'code': 'SPL', 'days_per_year': 5},
        {'name': 'Bereavement Leave', 'code': 'BL', 'days_per_year': 3},
        {'name': 'Paternity Leave', 'code': 'PL', 'days_per_year': 5},
        {'name': 'Long Leave', 'code': 'LL', 'days_per_year': 30},
        {'name': 'Comp Off', 'code': 'CO', 'days_per_year': 0},
    ]
    
    for lt_data in leave_types:
        LeaveType.objects.get_or_create(
            code=lt_data['code'],
            defaults={
                'name': lt_data['name'],
                'days_per_year': lt_data['days_per_year'],
                'carry_forward': False,
                'encashment': False
            }
        )
    
    # 2. Assign Balances to all Employees for current year
    current_year = datetime.now().year
    all_employees = Employees.objects.all()
    all_types = LeaveType.objects.all()
    
    count = 0
    for emp in all_employees:
        for lt in all_types:
            balance, created = EmployeeLeaveBalance.objects.get_or_create(
                employee=emp,
                leave_type=lt,
                year=current_year,
                defaults={
                    'allocated_days': lt.days_per_year,
                    'consumed_days': 0
                }
            )
            if created:
                count += 1
                
    print(f"Successfully seeded {count} leave balance records.")

if __name__ == "__main__":
    seed_leave_data()
