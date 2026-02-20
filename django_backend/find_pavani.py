import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees

emps = Employees.objects.filter(first_name__icontains='Pavani')
print(f"Found {emps.count()} employees matching 'Pavani'")
for emp in emps:
    print(f"ID: {emp.id}, EmpID: {emp.employee_id}, Name: {emp.first_name} {emp.last_name}, Role: {emp.role}")
