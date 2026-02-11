import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Leaves, Employees, Attendance

def inspect():
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_date_str = india_time.strftime('%Y-%m-%d')
    print(f"Current Date (India): {current_date_str}")

    # 1. Check Approved Leaves for Today
    leaves = Leaves.objects.filter(
        from_date__lte=current_date_str,
        to_date__gte=current_date_str,
        status='Approved'
    )
    print(f"\nFound {leaves.count()} Approved Leaves for today:")
    for l in leaves:
        print(f" - {l.employee.first_name} ({l.employee.employee_id}): {l.from_date} to {l.to_date}")

    # 2. Check Absentees Logic
    active_employees = Employees.objects.filter(status='Active')
    present_employee_ids = list(Attendance.objects.filter(
        date=current_date_str,
        check_in__isnull=False
    ).exclude(check_in='-').values_list('employee', flat=True))
    present_employee_ids = [pid for pid in present_employee_ids if pid is not None]

    absentees = active_employees.exclude(employee_id__in=present_employee_ids)
    print(f"\nTotal Active Employees: {active_employees.count()}")
    print(f"Total Present: {len(present_employee_ids)}")
    print(f"Total Absentees: {absentees.count()}")

    # 3. Intersection
    on_leave_ids = Leaves.objects.filter(
        employee__in=absentees,
        status='Approved',
        from_date__lte=current_date_str,
        to_date__gte=current_date_str
    ).values_list('employee__employee_id', flat=True)

    print(f"\nBackend Logic identifies {len(on_leave_ids)} people as 'On Leave':")
    for eid in on_leave_ids:
        print(f" - {eid}")

    # 4. Check specific users from screenshot
    targets = ['MW1017', 'MWI025', 'MWI002', 'MWI029', 'MWI018', 'MW1016']
    print(f"\nChecking specific users: {targets}")
    for eid in targets:
        emp = Employees.objects.filter(employee_id=eid).first()
        if emp:
            print(f"\n--- {emp.first_name} ({eid}) ---")
            # Check Attendance
            att = Attendance.objects.filter(employee=emp, date=current_date_str).first()
            print(f"Attendance Today: {att.check_in if att else 'No Record'}")
            
            # Check Leaves
            leaves = Leaves.objects.filter(employee=emp).order_by('-id')[:5]
            if leaves.exists():
                for l in leaves:
                    print(f"Leave: {l.from_date} to {l.to_date} ({l.status}) type={l.type}")
            else:
                print("No leave records found.")
        else:
            print(f"\n--- {eid} NOT FOUND ---")

if __name__ == '__main__':
    inspect()
