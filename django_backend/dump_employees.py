import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, Teams

data = []
for emp in Employees.objects.all():
    data.append({
        'id': emp.employee_id,
        'name': f"{emp.first_name} {emp.last_name}",
        'role': emp.role,
        'manages': list(Teams.objects.filter(manager=emp).values_list('name', flat=True))
    })

with open('all_employees.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Dumped {len(data)} employees")
