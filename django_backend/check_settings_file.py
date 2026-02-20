import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

with open("config_output.txt", "w") as f:
    f.write(f"OTP_DEBUG: {os.getenv('OTP_DEBUG')}\n")
    f.write(f"PERISKOPE_URL: {settings.PERISKOPE_URL}\n")
    if settings.PERISKOPE_API_KEY:
        f.write(f"PERISKOPE_API_KEY: {settings.PERISKOPE_API_KEY[:5]}... (Length: {len(settings.PERISKOPE_API_KEY)})\n")
    else:
        f.write("PERISKOPE_API_KEY: NOT SET\n")
    f.write(f"PERISKOPE_SENDER_PHONE: {settings.PERISKOPE_SENDER_PHONE}\n")
