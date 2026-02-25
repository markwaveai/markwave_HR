import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_backend.settings')
django.setup()

from core.models import Employees

roles = list(Employees.objects.values_list('role', flat=True).distinct())
print(f"Distinct roles in DB: {roles}")

from api.leave_views import ADMIN_ROLES
print(f"ADMIN_ROLES in leave_views: {ADMIN_ROLES}")

for role in roles:
    if role and role.strip().lower() in ADMIN_ROLES:
        print(f"MATCH: '{role}' matches an admin role.")
    else:
        print(f"NO MATCH: '{role}'")
