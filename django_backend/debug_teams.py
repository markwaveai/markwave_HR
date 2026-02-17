
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Teams, Employees

with open('teams_debug_output.txt', 'w', encoding='utf-8') as f:
    f.write("--- Teams ---\n")
    for t in Teams.objects.all():
        mgr_name = "None"
        if t.manager:
            mgr_name = f"{t.manager.first_name} {t.manager.last_name or ''}"
        f.write(f"ID: {t.id}, Name: '{t.name}', Manager: '{mgr_name}', Manager ID: {t.manager_id if t.manager else 'None'}\n")

    f.write("\n--- 'Team Lead' Employees ---\n")
    # Check if any employee is named "Team Lead"
    leads = Employees.objects.filter(first_name__icontains="Team", last_name__icontains="Lead")
    for emp in leads:
        f.write(f"ID: {emp.id}, Name: {emp.first_name} {emp.last_name}\n")

    f.write("\n--- 'No Team' Teams ---\n")
    no_teams = Teams.objects.filter(name__icontains="No Team")
    for t in no_teams:
        f.write(f"ID: {t.id}, Name: '{t.name}'\n")
