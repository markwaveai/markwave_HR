import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Leaves, Employees

def create_leave():
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today = india_time.strftime('%Y-%m-%d')
    print(f"Creating leave for date: {today}")

    # Check Sailaja
    emp = Employees.objects.filter(first_name__icontains='Sailaja').first()
    if emp:
        print(f"Found Sailaja: {emp.first_name} ({emp.employee_id})")
        
        # Create Leave
        leave = Leaves.objects.create(
            employee=emp,
            type='Casual Leave',
            from_date=today,
            to_date=today,
            days=1.0,
            reason='Debug Test Leave',
            status='Approved',
            created_at=india_time
        )
        print(f"Created Leave ID: {leave.id} for {today}")
        
    else:
        print("Sailaja not found")

if __name__ == '__main__':
    create_leave()
