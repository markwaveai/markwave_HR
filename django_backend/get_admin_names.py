
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees
from django.db.models import Q

def get_admin_names():
    # Define admin roles
    admin_roles = ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations']
    
    # query for admins
    admins = Employees.objects.filter(
        Q(role__in=admin_roles) | 
        Q(is_admin=True) |
        Q(first_name='Admin')
    ).distinct()
    
    names = []
    # Add the virtual admin if not in DB (usually it's handled in views, but let's list it if the user expects "Admin")
    # The user asked for "who the admins are", implies real people or the accounts they can use.
    
    for emp in admins:
        full_name = f"{emp.first_name} {emp.last_name or ''}".strip()
        names.append(full_name)
    
    return names

if __name__ == "__main__":
    names = get_admin_names()
    print("--- Admin Names ---")
    for name in names:
        # Encode to utf-8 to avoid console printing errors if non-ascii characters exist
        print(name)
