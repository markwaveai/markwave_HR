import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from api.utils import is_employee_admin
from core.models import Employees

# Mock employee object for testing logic
class MockEmployee:
    def __init__(self, role):
        self.role = role

test_roles = [
    'Admin',
    'Administrator',
    'Founder',
    'Project Manager',
    'Advisor-Technology & Operations',
    'Employee',
    'Manager',
    '  ADMIN  ',
    None,
    ''
]

print("--- Testing is_employee_admin Centralized Logic ---")
for role in test_roles:
    mock_emp = MockEmployee(role)
    result = is_employee_admin(mock_emp)
    print(f"Role: '{role}' => Is Admin: {result}")

# Check real employees in DB if any
print("\n--- Checking Real Employees in Database ---")
founder_count = Employees.objects.filter(role__iexact='Founder').count()
admin_count = Employees.objects.filter(role__iexact='Admin').count()
print(f"Founders in DB: {founder_count}")
print(f"Admins in DB: {admin_count}")
