import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees

def create_demo_user():
    email = 'demo@gmail.com'
    print(f"Checking for user {email}...")
    emp = Employees.objects.filter(email__iexact=email).first()
    if not emp:
        print(f"Creating demo user {email}...")
        try:
            emp = Employees.objects.create(
                employee_id='MW-DEMO',
                first_name='Demo',
                last_name='User',
                email='demo@gmail.com',
                role='Tester',
                status='Active',
                contact='0000000000'
            )
            print(f"Success! Demo user created with ID: {emp.id}")
        except Exception as e:
            print(f"Error creating user: {e}")
    else:
        print(f"User {email} already exists with ID: {emp.id}")
        if emp.status != 'Active':
            print("Activating user...")
            emp.status = 'Active'
            emp.save()
            print("User activated.")

if __name__ == "__main__":
    create_demo_user()
