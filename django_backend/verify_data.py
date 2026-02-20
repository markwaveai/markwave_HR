
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import LeaveType, EmployeeLeaveBalance, Holidays, Employees

print("--- VERIFICATION START ---")

# 1. Check Employee
user_email = "obulreddypavani90@gmail.com"
employee = Employees.objects.filter(email__iexact=user_email).first()

if employee:
    print(f"✅ User Found: {employee.first_name} (ID: {employee.employee_id})")
    
    # 2. Check Balances
    balances = EmployeeLeaveBalance.objects.filter(employee=employee)
    print(f"   Balances Found: {balances.count()}")
    for b in balances:
        print(f"   - {b.leave_type.code}: Allocated={b.allocated_days}, Consumed={b.consumed_days}")
else:
    print(f"❌ User {user_email} NOT FOUND!")

# 3. Check Leave Types
lt_count = LeaveType.objects.count()
print(f"Leave Types Count: {lt_count}")
for lt in LeaveType.objects.all():
    print(f"   - {lt.code}: {lt.name}")

# 4. Check Holidays
h_count = Holidays.objects.count()
print(f"Holidays Count: {h_count}")

print("--- VERIFICATION END ---")
