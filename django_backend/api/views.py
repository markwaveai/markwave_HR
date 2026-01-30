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
    data = request.data
    phone = data.get('phone')
    password = data.get('password')

    if not phone or not password:
        return Response({'error': 'Phone number and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if password != '000000':
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

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
                'is_manager': True
            }
        })

    normalized_input = normalize_phone(phone)
    if not normalized_input:
        return Response({'error': 'Invalid phone number format'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        employees = Employees.objects.all()
        employee = None
        for emp in employees:
            if normalize_phone(emp.contact) == normalized_input:
                employee = emp
                break
        
        if not employee:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'user': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'email': employee.email,
                'role': employee.role,
                'team_id': employee.team.id if employee.team else None,
                'team_lead_name': f"{employee.team.manager.first_name} {employee.team.manager.last_name}" if employee.team and employee.team.manager else "Team Lead",
                'is_manager': Teams.objects.filter(manager=employee).exists()
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def send_otp(request):
    phone = request.data.get('phone')
    if not phone:
        return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)

    normalized_input = normalize_phone(phone)
    target_phone = normalized_input if phone != 'admin' else 'admin'

    # Check if user exists
    if phone != 'admin':
        user_exists = False
        for emp in Employees.objects.all():
            if normalize_phone(emp.contact) == normalized_input:
                user_exists = True
                break
        if not user_exists:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    otp = str(random.randint(100000, 999999))
    OTPStore.objects.create(phone=target_phone, otp=otp, created_at=timezone.now())

    whatsapp_recipient = f"91{normalized_input}@c.us" if phone != 'admin' else "919247534762@c.us"
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
        response = requests.post(settings.PERISKOPE_URL, headers=headers, json=payload, timeout=30)
        if response.status_code in [200, 201]:
            return Response({'success': True, 'message': 'OTP sent successfully'})
        return Response({'error': f'Failed to send OTP: {response.text}'}, status=500)
    except Exception as e:
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
                    'is_manager': True
                }
            })

        for emp in Employees.objects.all():
            if normalize_phone(emp.contact) == normalized_input:
                return Response({
                    'success': True,
                    'user': {
                        'id': emp.id,
                        'employee_id': emp.employee_id,
                        'first_name': emp.first_name,
                        'last_name': emp.last_name,
                        'email': emp.email,
                        'role': emp.role,
                        'team_id': emp.team.id if emp.team else None,
                        'team_lead_name': f"{emp.team.manager.first_name} {emp.team.manager.last_name}" if emp.team and emp.team.manager else "Team Lead",
                        'is_manager': Teams.objects.filter(manager=emp).exists()
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
            'is_manager': True
        })
    try:
        emp = Employees.objects.filter(employee_id=employee_id).first()
        if not emp and str(employee_id).isdigit():
            emp = Employees.objects.filter(pk=employee_id).first()
            
        if not emp:
            return Response({'error': 'User not found'}, status=404)
            
        return Response({
            'id': emp.id,
            'employee_id': emp.employee_id,
            'first_name': emp.first_name,
            'last_name': emp.last_name,
            'role': emp.role,
            'team_id': emp.team.id if emp.team else None,
            'team_lead_name': f"{emp.team.manager.first_name} {emp.team.manager.last_name}" if emp.team and emp.team.manager else "Team Lead",
            'is_manager': Teams.objects.filter(manager=emp).exists()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)