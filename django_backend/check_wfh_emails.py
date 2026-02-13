import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees, Teams

def check_wfh_logic():
    employees = Employees.objects.all()
    print(f"Total Employees: {employees.count()}")
    
    for e in employees:
        manager_email = None
        # Try to get manager from teams
        teams = e.teams.all()
        team_names = [t.name for t in teams]
        if teams:
            for team in teams:
                if team.manager and team.manager.email and team.manager.employee_id != e.employee_id:
                    manager_email = team.manager.email
                    break
        
        fallback_used = False
        if not manager_email:
            admin = Employees.objects.filter(role__icontains='Admin').first()
            if admin:
                manager_email = admin.email
                fallback_used = True
        
        print(f"Emp: {e.first_name} {e.last_name} ({e.employee_id})")
        print(f"  Teams: {team_names}")
        print(f"  Manager Email: {manager_email} {'(Fallback)' if fallback_used else ''}")
        print("-" * 30)

if __name__ == "__main__":
    check_wfh_logic()
