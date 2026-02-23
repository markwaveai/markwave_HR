
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Employees

def test_orm():
    try:
        count = Employees.objects.count()
        print(f"Success! Found {count} employees.")
    except Exception as e:
        print(f"ORM Error: {e}")

if __name__ == "__main__":
    test_orm()
