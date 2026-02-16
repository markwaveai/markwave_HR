import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, Teams

roles = list(Employees.objects.values_list('role', flat=True).distinct())
print(f"ALL_ROLES: {roles}")

pavani = Employees.objects.filter(first_name__icontains='Pavani').first()
if pavani:
    print(f"PAVANI_ROLE: {pavani.role}")

anjali = Employees.objects.filter(first_name__icontains='Anjali').first()
if anjali:
    print(f"ANJALI_ROLE: {anjali.role}")
