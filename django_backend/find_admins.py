
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees
from django.db.models import Q

def is_user_admin(employee):
    admin_roles = ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations']
    return (
        employee.role in admin_roles or 
        getattr(employee, 'is_admin', False) or 
        employee.first_name == 'Admin'
    )

print("--- Admins ---")
admins = []
for emp in Employees.objects.all():
    if is_user_admin(emp):
        admins.append(f"{emp.first_name} {emp.last_name or ''} ({emp.employee_id}) - {emp.role}")

# Also check for the hardcoded 'Admin' user if it exists in DB or if it's just a virtual user in views
# based on views.py, there is a virtual admin user returned for phone='admin'
print("Virtual Admin: Admin User (MW-ADMIN) - Administrator")

for admin in admins:
    print(admin)
