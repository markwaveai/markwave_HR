
import os
import django
import sys
from django.db.models import Q

# Add the project root to the python path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')

django.setup()

from core.models import Employees

# Find employees with 'admin' in their role (case insensitive)
admins = Employees.objects.filter(role__icontains='admin')

print(f"Found {admins.count()} employees with 'admin' in role:")
for emp in admins:
    print(f"ID: {emp.employee_id}, Name: {emp.first_name} {emp.last_name}, Role: '{emp.role}'")

# Also check for 'Advisor' as seen before
advisors = Employees.objects.filter(role__icontains='advisor')
print(f"\nFound {advisors.count()} employees with 'advisor' in role:")
for emp in advisors:
    print(f"ID: {emp.employee_id}, Name: {emp.first_name} {emp.last_name}, Role: '{emp.role}'")
