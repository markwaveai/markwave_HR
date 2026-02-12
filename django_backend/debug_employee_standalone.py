import os
import django

# Set up Django environment using the settings module from manage.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees

# Query the database
try:
    emp = Employees.objects.get(employee_id='MWI005')
    print("--- START DEBUG ---")
    print(f"ID: {emp.id}")
    print(f"Employee ID: {emp.employee_id}")
    # Handle None values gracefully for printing
    email = emp.email if emp.email else '-'
    contact = emp.contact if emp.contact else '-'
    location = emp.location if emp.location else '-'
    aadhar = emp.aadhar if emp.aadhar else '-'
    joining = emp.joining_date if emp.joining_date else '-'
    
    print(f"Email: '{email}'")
    print(f"Contact: '{contact}'")
    print(f"Location: '{location}'")
    print(f"Aadhar: '{aadhar}'")
    print(f"Joining Date: '{joining}'")
    print("--- END DEBUG ---")
except Employees.DoesNotExist:
    print("Employee MWI005 not found")
except Exception as e:
    print(f"Error: {e}")
