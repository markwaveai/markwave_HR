import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

print("--- CONFIG CHECK ---")
print(f"OTP_DEBUG: '{os.getenv('OTP_DEBUG')}'")
print(f"PERISKOPE_URL: '{settings.PERISKOPE_URL}'")

api_key = settings.PERISKOPE_API_KEY
if api_key:
    print(f"PERISKOPE_API_KEY: '{api_key[:5]}...' (Length: {len(api_key)})")
else:
    print("PERISKOPE_API_KEY: NOT SET")

print(f"PERISKOPE_SENDER_PHONE: '{settings.PERISKOPE_SENDER_PHONE}'")
print("--- END CONFIG CHECK ---")
