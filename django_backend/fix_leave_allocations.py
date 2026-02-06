import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, LeaveType, EmployeeLeaveBalance

def fix_leave_allocations():
    """
    Set correct leave allocations based on employee tenure:
    - CL, SL, BL: All employees
    - EL, SCL: 2+ years
    - LL: 5+ years
    - PL, CO: Special cases (set to 0 for now)
    """
    
    current_year = 2026
    today = datetime.date.today()
    
    # Get all leave types
    leave_types = {lt.code: lt for lt in LeaveType.objects.all()}
    
    employees = Employees.objects.all()
    print(f"Updating allocations for {employees.count()} employees...\n")
    
    for emp in employees:
        # Calculate tenure
        tenure_years = 0
        if emp.joining_date:
            tenure_days = (today - emp.joining_date).days
            tenure_years = tenure_days / 365.25
        
        print(f"{emp.first_name} {emp.last_name} - Tenure: {tenure_years:.2f} years")
        
        # Set allocations based on tenure
        allocations = {
            'CL': 12,   # All employees
            'SL': 12,   # All employees
            'BL': 5,    # All employees
            'EL': 15 if tenure_years >= 2 else 0,   # 2+ years
            'SCL': 3 if tenure_years >= 2 else 0,   # 2+ years
            'LL': 90 if tenure_years >= 5 else 0,   # 5+ years
            'PL': 0,    # Special case - manual allocation
            'CO': 0,    # Special case - manual allocation
            'LWP': 0    # Unlimited - no allocation needed
        }
        
        for code, days in allocations.items():
            if code in leave_types:
                EmployeeLeaveBalance.objects.update_or_create(
                    employee=emp,
                    leave_type=leave_types[code],
                    year=current_year,
                    defaults={'allocated_days': days}
                )
        
        print(f"  Allocated: CL={allocations['CL']}, SL={allocations['SL']}, EL={allocations['EL']}, SCL={allocations['SCL']}, LL={allocations['LL']}, BL={allocations['BL']}\n")
    
    print("Leave allocations updated successfully!")

if __name__ == '__main__':
    fix_leave_allocations()
