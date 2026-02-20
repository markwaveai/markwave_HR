import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'django_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees

print(f"Total Employees: {Employees.objects.count()}")
for emp in Employees.objects.all()[:10]:
    print(f"ID: {emp.id}, EmpID: {emp.employee_id}, Name: {emp.first_name} {emp.last_name}, Role: {emp.role}")
