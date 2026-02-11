import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Leaves, Employees

def check():
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today = india_time.strftime('%Y-%m-%d')
    print(f"Checking for date: {today}")

    # Check Sailaja
    emp = Employees.objects.filter(first_name__icontains='Sailaja').first()
    if emp:
        print(f"Found Sailaja: {emp.first_name} ({emp.employee_id})")
        leaves = Leaves.objects.filter(employee=emp).order_by('-id')[:5]
        for l in leaves:
            print(f" - {l.from_date} to {l.to_date} [{l.status}] (Type: {l.type})")
            if l.from_date <= today <= l.to_date:
                print(f"   *** MATCHES TODAY *** Status: {l.status}")
    else:
        print("Sailaja not found")

    # Check ALL pending leaves for today
    pending = Leaves.objects.filter(
        from_date__lte=today,
        to_date__gte=today,
        status='Pending'
    )
    print(f"\nPending Leaves for Today: {pending.count()}")
    for p in pending:
        print(f" - {p.employee.first_name}: {p.from_date} to {p.to_date}")

if __name__ == '__main__':
    check()
