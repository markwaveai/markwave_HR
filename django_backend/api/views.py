import re
import traceback
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.models import Employees, Teams
import random
import requests
from django.conf import settings
from .models import OTPStore
from django.utils import timezone

def normalize_phone(phone_str):
    if not phone_str:
        return ""
    digits = re.sub(r'\D', '', str(phone_str))
    if len(digits) == 12 and digits.startswith('91'):
        return digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        return digits[1:]
    return digits

@api_view(['POST'])
def login(request):
    """
    Static password login has been disabled for security.
    Please use OTP-based login (Phone or Email) instead.
    """
    return Response({
        'error': 'Static password login is disabled. Please use Phone or Email OTP to sign in.'
    }, status=status.HTTP_403_FORBIDDEN)

@api_view(['POST'])
def send_otp(request):
    try:
        print("====== OTP DEBUG START ======")
        print(f"Content-Type: {request.content_type}")
        print(f"Body: {request.body.decode('utf-8')}")
        print(f"Data: {request.data}")
        
        phone = request.data.get('phone')
        print(f"[OTP DEBUG] Received OTP request for phone: {phone}")
        
        if not phone:
            print("[OTP DEBUG] Phone number missing in request")
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)

        normalized_input = normalize_phone(phone)
        print(f"[OTP DEBUG] Normalized phone: {normalized_input}")
        
        target_phone = normalized_input if phone != 'admin' else 'admin'

        # Check if user exists
        if phone != 'admin':
            user_exists = False
            for emp in Employees.objects.all():
                if normalize_phone(emp.contact) == normalized_input:
                    user_exists = True
                    break
            
            print(f"[OTP DEBUG] User exists check for {normalized_input}: {user_exists}")
            
            if not user_exists:
                print("[OTP DEBUG] User not found")
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            # Check for inactive status
            for emp in Employees.objects.all():
                if normalize_phone(emp.contact) == normalized_input:
                    if emp.status == 'Inactive':
                        return Response({'error': 'Your account is inactive. Please contact HR.'}, status=status.HTTP_403_FORBIDDEN)
                    break

        otp = str(random.randint(100000, 999999))
        print(f"[OTP DEBUG] Generated OTP: {otp}")
        
        OTPStore.objects.create(phone=target_phone, otp=otp, created_at=timezone.now())

        whatsapp_recipient = f"91{normalized_input}@c.us" if phone != 'admin' else f"{settings.ADMIN_WHATSAPP_NUMBER}@c.us"
        print(f"[OTP DEBUG] WhatsApp Recipient: {whatsapp_recipient}")
        
        headers = {
            "Authorization": f"Bearer {settings.PERISKOPE_API_KEY}",
            "Content-Type": "application/json",
            "x-phone": settings.PERISKOPE_SENDER_PHONE
        }
        payload = {
            "chat_id": whatsapp_recipient,
            "type": "text",
            "message": f"Your MarkwaveHR login OTP is: {otp}"
        }

        # OTP_DEBUG MODE: Skip WhatsApp in development (controlled by OTP_DEBUG env var)
        otp_debug_mode = os.getenv('OTP_DEBUG', 'False') == 'True'
        if otp_debug_mode:
            print(f"[OTP DEBUG] ⚠️ OTP_DEBUG MODE: Skipping WhatsApp send")
            print(f"[OTP DEBUG] ✅ OTP for {phone}: {otp}")
            print(f"[OTP DEBUG] Use this OTP to login in the mobile app")
            return Response({'success': True, 'message': 'OTP sent successfully (DEBUG MODE - check console)'})
        
        print(f"[OTP DEBUG] Sending to Periskope: {settings.PERISKOPE_URL}")
        try:
            response = requests.post(settings.PERISKOPE_URL, headers=headers, json=payload, timeout=30)
            print(f"[OTP DEBUG] Periskope Response Status: {response.status_code}")
            print(f"[OTP DEBUG] Periskope Response Body: {response.text}")
            
            if response.status_code in [200, 201]:
                return Response({'success': True, 'message': 'OTP sent successfully'})
            return Response({'error': f'Failed to send OTP: {response.text}'}, status=500)
        except Exception as e:
             print(f"[OTP DEBUG] Exception sending OTP request: {str(e)}")
             return Response({'error': f'WhatsApp API connection error: {str(e)}'}, status=500)

    except Exception as e:
        import traceback
        traceback.print_exc()
        # Handle specific DB connection errors
        error_msg = str(e)
        if "too many clients" in error_msg or "connection to server" in error_msg:
            return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'error': f"Internal Server Error: {error_msg}"}, status=500)

@api_view(['POST'])
def verify_otp(request):
    phone = request.data.get('phone')
    otp = request.data.get('otp')

    if not phone or not otp:
        return Response({'error': 'Phone and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    normalized_input = normalize_phone(phone)
    target_phone = normalized_input if phone != 'admin' else 'admin'

    try:
        otp_entry = OTPStore.objects.filter(phone=target_phone, is_verified=False).order_by('-created_at').first()
        if not otp_entry or otp_entry.otp != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_401_UNAUTHORIZED)
        
        otp_entry.is_verified = True
        otp_entry.verified_at = timezone.now()
        otp_entry.save()

        if phone == 'admin':
            return Response({
                'success': True,
                'user': {
                    'id': '0',
                    'employee_id': 'MW-ADMIN',
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'email': 'admin@markwave.com',
                    'role': 'Administrator',
                    'team_id': None,
                    'team_lead_name': 'Management',
                    'is_manager': True,
                    'is_admin': True
                }
            })

        for emp in Employees.objects.all():
            if normalize_phone(emp.contact) == normalized_input:
                if emp.status == 'Inactive':
                    return Response({'error': 'Your account is inactive. Please contact HR.'}, status=status.HTTP_403_FORBIDDEN)

                # Fetch dynamic managers
                from django.db.models import Q
                managers = Employees.objects.filter(Q(role='Manager') | Q(role='Project Manager'))
                manager_names = ", ".join([f"{m.first_name} {m.last_name or ''}".strip() for m in managers])
                advisor = Employees.objects.filter(role='Advisor-Technology & Operations').first()

                return Response({
                    'success': True,
                    'user': {
                        'id': emp.id,
                        'employee_id': emp.employee_id,
                        'first_name': emp.first_name,
                        'last_name': emp.last_name,
                        'email': emp.email,
                        'contact': emp.contact,
                        'location': emp.location,
                        'aadhar': emp.aadhar,
                        'qualification': emp.qualification,
                        'joining_date': emp.joining_date,
                        'role': emp.role,
                        'team_id': emp.teams.first().id if emp.teams.exists() else None,
                        'team_ids': ",".join([str(t.id) for t in emp.teams.all()]),
                        'team_name': ", ".join([t.name for t in emp.teams.all()]) or None,
                        'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name or ''}".strip() if t.manager else None} for t in (list(emp.teams.all()) + list(Teams.objects.filter(manager=emp)))],
                        'team_lead_name': ", ".join([f"{t.manager.first_name} {t.manager.last_name or ''}".strip() for t in emp.teams.all() if t.manager and t.manager.role != 'Intern']) or None,
                        'is_manager': Teams.objects.filter(manager=emp).exists(),
                        'is_admin': getattr(emp, 'is_admin', False),
                        'project_manager_name': manager_names,
                        'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None
                    }
                })
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        error_msg = str(e)
        if "too many clients" in error_msg or "connection to server" in error_msg:
            return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'error': error_msg}, status=500)

@api_view(['GET'])
def get_profile(request, employee_id):
    if employee_id == '0' or employee_id == 'admin':
        return Response({
            'id': '0',
            'employee_id': 'MW-ADMIN',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'Administrator',
            'team_lead_name': 'Management',
            'is_manager': True,
            'is_admin': True
        })
    try:
        emp = Employees.objects.filter(employee_id=employee_id).first()
        if not emp and str(employee_id).isdigit():
            emp = Employees.objects.filter(pk=employee_id).first()
            
        if not emp:
            return Response({'error': 'User not found'}, status=404)
            
        # Fetch dynamic managers
        from django.db.models import Q
        managers = Employees.objects.filter(Q(role='Manager') | Q(role='Project Manager') | Q(role='Administrator') | Q(role='Admin'))
        manager_names = ", ".join([f"{m.first_name} {m.last_name or ''}".strip() for m in managers])
        advisor = Employees.objects.filter(role='Advisor-Technology & Operations').first()
        
        return Response({
            'id': emp.id,
            'employee_id': emp.employee_id,
            'first_name': emp.first_name,
            'last_name': emp.last_name,
            'role': emp.role,
            'email': emp.email,
            'contact': emp.contact,
            'location': emp.location,
            'aadhar': emp.aadhar,
            'qualification': emp.qualification,
            'joining_date': emp.joining_date,
            'team_id': emp.teams.first().id if emp.teams.exists() else None,
            'team_ids': ",".join([str(t.id) for t in emp.teams.all()]),
            'team_name': ", ".join([t.name for t in emp.teams.all()]) or None,
            'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name or ''}".strip() if t.manager else None} for t in (list(emp.teams.all()) + list(Teams.objects.filter(manager=emp)))],
            'team_leads': [f"{t.manager.first_name} {t.manager.last_name or ''}".strip() for t in emp.teams.all() if t.manager and t.manager.role != 'Intern'],
            'team_lead_name': ", ".join([f"{t.manager.first_name} {t.manager.last_name or ''}".strip() for t in emp.teams.all() if t.manager and t.manager.role != 'Intern']) or None,
            'is_manager': Teams.objects.filter(manager=emp).exists(),
            'is_admin': getattr(emp, 'is_admin', False),
            'project_manager_name': manager_names,
            'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None
        })
    except Exception as e:
        error_msg = str(e)
        if "too many clients" in error_msg or "connection to server" in error_msg:
            return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'error': error_msg}, status=500)

from .utils import send_email_via_api
from .models import EmailOTPStore

@api_view(['POST'])
def send_email_otp(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists with this email
        user_exists = False
        if email == 'admin@markwave.com':
            user_exists = True
        else:
            # Case insensitive email check might be better but for now match exact or lowercase
            for emp in Employees.objects.all():
                if emp.email and emp.email.lower() == email.lower():
                    user_exists = True
                    break
        
        if not user_exists:
            return Response({'error': 'User not found with this email'}, status=status.HTTP_404_NOT_FOUND)

        # Check for inactive status
        if email != 'admin@markwave.com':
            inactive_check = Employees.objects.filter(email__iexact=email, status='Inactive').exists()
            if inactive_check:
                return Response({'error': 'Your account is inactive. Please contact HR.'}, status=status.HTTP_403_FORBIDDEN)

        otp = str(random.randint(100000, 999999))
        # Use EmailOTPStore for email OTPs
        EmailOTPStore.objects.create(email=email, otp=otp, created_at=timezone.now())

        subject = "MarkwaveHR Login OTP"
        body = f"<h1>Your MarkwaveHR login OTP is: {otp}</h1>"
        
        success, result = send_email_via_api(email, subject, body)
        
        if success:
            return Response({'success': True, 'message': 'OTP sent successfully to email'})
        else:
            return Response({'error': f'Failed to send email: {result}'}, status=500)
    except Exception as e:
        error_msg = str(e)
        if "too many clients" in error_msg or "connection to server" in error_msg:
            return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'error': f'Internal Server Error: {error_msg}'}, status=500)

@api_view(['POST'])
def verify_email_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Retrieve the latest unverified OTP for this email
        otp_entry = EmailOTPStore.objects.filter(email=email, is_verified=False).order_by('-created_at').first()
        
        if not otp_entry or otp_entry.otp != otp:
             return Response({'error': 'Invalid OTP'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify OTP
        otp_entry.is_verified = True
        otp_entry.verified_at = timezone.now()
        otp_entry.save()

        # Return user details
        if email == 'admin@markwave.com':
            return Response({
                'success': True,
                'user': {
                    'id': '0',
                    'employee_id': 'MW-ADMIN',
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'email': 'admin@markwave.com',
                    'role': 'Administrator',
                    'team_id': None,
                    'team_lead_name': 'Management',
                    'is_manager': True
                }
            })

        employee = Employees.objects.filter(email__iexact=email).first()
        if not employee:
            return Response({'error': 'User not found'}, status=404)

        if employee.status == 'Inactive':
            return Response({'error': 'Your account is inactive. Please contact HR.'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch dynamic managers
        from django.db.models import Q
        managers = Employees.objects.filter(Q(role='Manager') | Q(role='Project Manager') | Q(role='Administrator') | Q(role='Admin'))
        manager_names = ", ".join([f"{m.first_name} {m.last_name or ''}".strip() for m in managers])
        advisor = Employees.objects.filter(role='Advisor-Technology & Operations').first()

        return Response({
            'success': True,
            'user': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'email': employee.email,
                'contact': employee.contact,
                'location': employee.location,
                'aadhar': employee.aadhar,
                'qualification': employee.qualification,
                'joining_date': employee.joining_date,
                'role': employee.role,
                'team_id': employee.teams.first().id if employee.teams.exists() else None,
                'team_ids': ",".join([str(t.id) for t in employee.teams.all()]),
                'team_name': ", ".join([t.name for t in employee.teams.all()]) or "No Team",
                'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name or ''}".strip() if t.manager else None} for t in (list(employee.teams.all()) + list(Teams.objects.filter(manager=employee)))],
                'team_lead_name': ", ".join([f"{t.manager.first_name} {t.manager.last_name or ''}".strip() for t in employee.teams.all() if t.manager and t.manager.role != 'Intern']) or "Team Lead",
                'is_manager': Teams.objects.filter(manager=employee).exists(),
                'is_admin': getattr(employee, 'is_admin', False),
                'project_manager_name': manager_names,
                'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None
            }
        })
    except Exception as e:
        error_msg = str(e)
        if "too many clients" in error_msg or "connection to server" in error_msg:
            return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'error': error_msg}, status=500)