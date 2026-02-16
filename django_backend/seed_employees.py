import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees

def seed_employees():
    with open('all_employees.json', 'r') as f:
        employees_data = json.load(f)
    
    count = 0
    for emp in employees_data:
        emp_id = emp.get('id')
        if not emp_id:
            continue
            
        full_name = emp.get('name', '')
        parts = full_name.split()
        first_name = parts[0] if parts else "Unknown"
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        
        # Check if already exists
        if Employees.objects.filter(employee_id=emp_id).exists():
            continue
            
        Employees.objects.create(
            employee_id=emp_id,
            first_name=first_name,
            last_name=last_name,
            role=emp.get('role'),
            status='Active',
            email=f"{emp_id.lower()}@example.com" if emp_id else None
        )
        count += 1
    
    print(f"Successfully seeded {count} employees.")

if __name__ == "__main__":
    seed_employees()
