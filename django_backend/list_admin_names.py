
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees
from django.db.models import Q

def list_admins():
    admin_roles = ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations']
    
    # Filter only by role and name, since is_admin is not a DB field
    admins = Employees.objects.filter(
        Q(role__in=admin_roles) | 
        Q(first_name='Admin')
    ).distinct()
    
    with open('admin_names_list.txt', 'w', encoding='utf-8') as f:
        # Virtual Admin (from views.py)
        f.write("Admin User (MW-ADMIN)\n")
        
        for emp in admins:
            full_name = f"{emp.first_name} {emp.last_name or ''}".strip()
            role = emp.role or "No Role"
            f.write(f"{full_name} ({emp.employee_id}) - {role}\n")

if __name__ == "__main__":
    try:
        list_admins()
        print("Successfully wrote admin names to admin_names_list.txt")
    except Exception as e:
        print(f"Error: {e}")
