import re
import traceback
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

    try:
        print(f"[OTP DEBUG] Sending to Periskope: {settings.PERISKOPE_URL}")
        response = requests.post(settings.PERISKOPE_URL, headers=headers, json=payload, timeout=30)
        print(f"[OTP DEBUG] Periskope Response Status: {response.status_code}")
        print(f"[OTP DEBUG] Periskope Response Body: {response.text}")
        
        if response.status_code in [200, 201]:
            return Response({'success': True, 'message': 'OTP sent successfully'})
        return Response({'error': f'Failed to send OTP: {response.text}'}, status=500)
    except Exception as e:
        print(f"[OTP DEBUG] Exception sending OTP: {str(e)}")
        return Response({'error': f'WhatsApp API error: {str(e)}'}, status=500)

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

                return Response({
                    'success': True,
                    'user': {
                        'id': emp.id,
                        'employee_id': emp.employee_id,
                        'first_name': emp.first_name,
                        'last_name': emp.last_name,
                        'email': emp.email,
                        'role': emp.role,
                        'team_id': emp.teams.first().id if emp.teams.exists() else None,
                        'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name}" if t.manager else None} for t in emp.teams.all()],
                        'team_lead_name': f"{emp.teams.first().manager.first_name} {emp.teams.first().manager.last_name}" if emp.teams.exists() and emp.teams.first().manager else "Team Lead",
                        'is_manager': Teams.objects.filter(manager=emp).exists(),
                        'is_admin': getattr(emp, 'is_admin', False)
                    }
                })
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

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
        pm = Employees.objects.filter(role='Project Manager').first()
        advisor = Employees.objects.filter(role='Advisor-Technology & Operations').first()
        
        return Response({
            'id': emp.id,
            'employee_id': emp.employee_id,
            'first_name': emp.first_name,
            'last_name': emp.last_name,
            'role': emp.role,
            'team_id': emp.teams.first().id if emp.teams.exists() else None,
            'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name}" if t.manager else None} for t in emp.teams.all()],
            'team_lead_name': f"{emp.teams.first().manager.first_name} {emp.teams.first().manager.last_name}" if emp.teams.exists() and emp.teams.first().manager else "Team Lead",
            'is_manager': Teams.objects.filter(manager=emp).exists(),
            'is_admin': getattr(emp, 'is_admin', False),
            'project_manager_name': f"{pm.first_name} {pm.last_name}" if pm else None,
            'advisor_name': f"{advisor.first_name} {advisor.last_name}" if advisor else None
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

from .utils import send_email_via_api
from .models import EmailOTPStore

@api_view(['POST'])
def send_email_otp(request):
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

        return Response({
            'success': True,
            'user': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'email': employee.email,
                'role': employee.role,
                'team_id': employee.teams.first().id if employee.teams.exists() else None,
                'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name}" if t.manager else None} for t in employee.teams.all()],
                'team_lead_name': f"{employee.teams.first().manager.first_name} {employee.teams.first().manager.last_name}" if employee.teams.exists() and employee.teams.first().manager else "Team Lead",
                'is_manager': Teams.objects.filter(manager=employee).exists(),
                'is_admin': getattr(employee, 'is_admin', False)
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)