from core.models import Employees
try:
    emp = Employees.objects.get(employee_id='MWI005')
    print(f"--- START DEBUG ---")
    print(f"ID: {emp.id}")
    print(f"Employee ID: {emp.employee_id}")
    print(f"Email: '{emp.email}'")
    print(f"Contact: '{emp.contact}'")
    print(f"Location: '{emp.location}'")
    print(f"Aadhar: '{emp.aadhar}'")
    print(f"Joining Date: '{emp.joining_date}'")
    print(f"--- END DEBUG ---")
except Employees.DoesNotExist:
    print("Employee MWI005 not found")
except Exception as e:
    print(f"Error: {e}")
