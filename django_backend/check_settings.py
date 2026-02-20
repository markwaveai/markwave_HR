import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

print(f"OTP_DEBUG: {os.getenv('OTP_DEBUG')}")
print(f"PERISKOPE_URL: {settings.PERISKOPE_URL}")
print(f"PERISKOPE_API_KEY: {settings.PERISKOPE_API_KEY[:5]}..." if settings.PERISKOPE_API_KEY else "PERISKOPE_API_KEY: Not Set")
print(f"PERISKOPE_SENDER_PHONE: {settings.PERISKOPE_SENDER_PHONE}")
