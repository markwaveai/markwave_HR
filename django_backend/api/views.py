import re
import traceback
import os
from rest_framework.decorators import api_view
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from core.models import Employees, Teams
import random
import requests
from .models import OTPStore
from django.utils import timezone
from .utils import is_employee_admin, send_email_via_api
import threading
from django.db.models import Q
from core.models import Employees, Teams, SupportQuery

@api_view(['POST'])
def submit_support_query(request):
    try:
        data = request.data
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        email = data.get('email')
        phone = data.get('phone')
        message = data.get('message')

        if not all([first_name, last_name, email, phone, message]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Save to database
        query = SupportQuery.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            message=message
        )

        # Notify admins in background
        threading.Thread(target=notify_admins_of_support_query, args=(query.id,)).start()

        return Response({'message': 'Your message has been received. We will get back to you soon.', 'id': query.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def notify_admins_of_support_query(query_id):
    try:
        query = SupportQuery.objects.get(pk=query_id)
        
        # Find all admins/managers
        admins = Employees.objects.filter(
            Q(role__icontains='Admin') | 
            Q(role__icontains='Manager') | 
            Q(role__icontains='Founder') |
            Q(role__icontains='Advisor')
        ).exclude(email__isnull=True).exclude(email='')

        recipient_emails = list(set([admin.email.strip() for admin in admins if admin.email]))

        if not recipient_emails:
            print(f"DEBUG: No admin emails found to notify for support query {query_id}")
            return

        subject = f"New Support Message - {query.first_name} {query.last_name}"
        
        body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
        <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Support Inquiry</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">Hello Admin,</p>
                <p style="font-size: 15px; color: #333333; margin: 0 0 25px 0;">
                    A new message has been received through the portal support form.
                </p>
                
                <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0; border: 1px solid #edf2f7;">
                    <tr>
                        <td style="color: #64748b; font-size: 13px; font-weight: bold; width: 120px;">NAME:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: bold;">{query.first_name} {query.last_name}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; font-size: 13px; font-weight: bold;">EMAIL:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: bold;">{query.email}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; font-size: 13px; font-weight: bold;">PHONE:</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: bold;">{query.phone}</td>
                    </tr>
                    <tr>
                        <td style="color: #64748b; font-size: 13px; font-weight: bold; vertical-align: top;">MESSAGE:</td>
                        <td style="color: #1e293b; font-size: 14px; line-height: 1.5;">{query.message}</td>
                    </tr>
                </table>
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #edf2f7;">
                    This is an automated alert from the Markwave HR Portal.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>"""

        for recipient in recipient_emails:
            send_email_via_api(recipient, subject, body)
            print(f"DEBUG: Sent support query notification to {recipient}")

    except Exception as e:
        print(f"ERROR in notify_admins_of_support_query: {str(e)}")

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
    Login with email and password.
    Supports a static bypass for APK testing: demo@gmail.com / Demo@123
    """
    email = request.data.get('email')
    password = request.data.get('password')

    # Static bypass for testing
    if email == 'demo@gmail.com' and password == 'Demo@123':
        from core.models import Teams
        from django.db.models import Q

        # Check if demo user exists, otherwise create
        emp = Employees.objects.filter(email__iexact=email).first()
        if not emp:
            # Create a mock demo employee if it doesn't exist
            emp = Employees.objects.create(
                employee_id='MW-DEMO',
                first_name='Demo',
                last_name='User',
                email='demo@gmail.com',
                role='Tester',
                status='Active',
                contact='0000000000'
            )
        
        # Inactive check
        if emp.status == 'Inactive':
            return Response({'error': 'Your account is inactive. Please contact HR.'}, status=status.HTTP_403_FORBIDDEN)

        # Get session info like in verify_email_otp
        managers = Employees.objects.filter(Q(role='Manager') | Q(role='Project Manager') | Q(role='Administrator') | Q(role='Admin'))
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
                'role': emp.role,
                'team_id': emp.teams.first().id if emp.teams.exists() else None,
                'team_ids': ",".join([str(t.id) for t in emp.teams.all()]),
                'team_name': ", ".join([t.name for t in emp.teams.all()]) or "Testing Team",
                'teams': [{'id': t.id, 'name': t.name, 'manager_name': f"{t.manager.first_name} {t.manager.last_name or ''}".strip() if t.manager else None} for t in (list(emp.teams.all()) + list(Teams.objects.filter(manager=emp)))],
                'team_lead_name': ", ".join([f"{t.manager.first_name} {t.manager.last_name or ''}".strip() for t in emp.teams.all() if t.manager and t.manager.role != 'Intern']) or "Team Lead",
                'is_manager': Teams.objects.filter(manager=emp).exists(),
                'is_admin': is_employee_admin(emp),
                'project_manager_name': manager_names,
                'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None,
                'profile_picture': request.build_absolute_uri(emp.profile_picture.url) if emp.profile_picture else None
            }
        })

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

        purpose = request.data.get('purpose', 'login')

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
            # Allow OTP for inactive accounts IF the purpose is 'activate' (requested by Admin)
            for emp in Employees.objects.all():
                if normalize_phone(emp.contact) == normalized_input:
                    if emp.status == 'Inactive' and purpose != 'activate':
                        return Response({'error': 'Your account is inactive. Please contact HR for reactivation.'}, status=status.HTTP_403_FORBIDDEN)
                    elif emp.status == 'Active' and purpose == 'activate':
                        return Response({'error': 'Your account is already active.'}, status=status.HTTP_400_BAD_REQUEST)
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
                        'is_admin': is_employee_admin(emp),
                        'project_manager_name': manager_names,
                        'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None,
                        'profile_picture': request.build_absolute_uri(emp.profile_picture.url) if emp.profile_picture else None
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
    if employee_id == '0' or employee_id == 'admin' or employee_id == '999' or employee_id == 'MW-DEMO':
        return Response({
            'id': 999,
            'employee_id': 'MW-DEMO',
            'first_name': 'Demo',
            'last_name': 'User',
            'role': 'Tester',
            'team_lead_name': 'Management',
            'is_manager': False,
            'is_admin': False
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
            'is_admin': is_employee_admin(emp),
            'project_manager_name': manager_names,
            'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None,
            'profile_picture': request.build_absolute_uri(emp.profile_picture.url) if emp.profile_picture else None
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

        if email.lower() == 'demo@gmail.com':
            return Response({'success': True, 'message': 'OTP sent successfully to email (DEMO MODE: use 123456)'})

        # Check if user exists with this email
        user_exists = False
        if email == 'admin@markwave.com':
            user_exists = True
        else:
            # Case insensitive email check might be better but for now match exact or lowercase
            try:
                for emp in Employees.objects.all():
                    if emp.email and emp.email.lower() == email.lower():
                        user_exists = True
                        break
            except Exception:
                pass
        
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
        if email.lower() == 'demo@gmail.com' and otp == '123456':
            # Static bypass for demo user
            return Response({
                'success': True,
                'user': {
                    'id': 999,
                    'employee_id': 'MW-DEMO',
                    'first_name': 'Demo',
                    'last_name': 'User',
                    'email': 'demo@gmail.com',
                    'contact': '0000000000',
                    'location': 'Testing Lab',
                    'role': 'Tester',
                    'team_id': 1,
                    'team_ids': "1",
                    'team_name': "Testing Team",
                    'teams': [{'id': 1, 'name': 'Testing Team', 'manager_name': 'Test Manager'}],
                    'team_lead_name': "Test Manager",
                    'is_manager': False,
                    'is_admin': False,
                    'project_manager_name': "Demo PM",
                    'advisor_name': "Demo Advisor"
                }
            })

        # Retrieve the latest unverified OTP for this email
        try:
            otp_entry = EmailOTPStore.objects.filter(email=email, is_verified=False).order_by('-created_at').first()
            
            if not otp_entry or otp_entry.otp != otp:
                 return Response({'error': 'Invalid OTP'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Verify OTP
            otp_entry.is_verified = True
            otp_entry.verified_at = timezone.now()
            otp_entry.save()
        except Exception:
            # If DB is down, only the demo bypass works (handled above)
            return Response({'error': 'Verification system unavailable'}, status=503)

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
                'is_admin': is_employee_admin(employee),
                'project_manager_name': manager_names,
                'advisor_name': f"{advisor.first_name} {advisor.last_name or ''}".strip() if advisor else None,
                'profile_picture': request.build_absolute_uri(employee.profile_picture.url) if employee.profile_picture else None
            }
        })
    except Exception as e:
        error_msg = str(e)
        if "too many clients" in error_msg or "connection to server" in error_msg:
            return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'error': error_msg}, status=500)

@api_view(['POST'])
def update_account_status(request):
    phone = request.data.get('phone')
    otp = request.data.get('otp')
    action = request.data.get('action') # 'activate' or 'deactivate'
    acting_user_id = request.data.get('acting_user_id')

    if not phone or not otp or not action or not acting_user_id:
        return Response({'error': 'Phone, OTP, action, and acting_user_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Permission check: Only admins can activate/deactivate accounts
    try:
        if str(acting_user_id).isdigit():
            acting_emp = Employees.objects.get(id=acting_user_id)
        else:
            acting_emp = Employees.objects.get(employee_id=acting_user_id)
        
        if not is_employee_admin(acting_emp):
            return Response({'error': 'Unauthorized. Only administrators can change account status.'}, status=status.HTTP_403_FORBIDDEN)
    except Employees.DoesNotExist:
        return Response({'error': 'Acting user not found'}, status=status.HTTP_403_FORBIDDEN)

    normalized_input = normalize_phone(phone)
    target_phone = normalized_input if phone != 'admin' else 'admin'
    
    if target_phone == 'admin':
        return Response({'error': 'Cannot modify admin account status'}, status=status.HTTP_403_FORBIDDEN)

    try:
        # OTP verification for the target phone number
        otp_entry = OTPStore.objects.filter(phone=target_phone, is_verified=False).order_by('-created_at').first()
        if not otp_entry or otp_entry.otp != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_401_UNAUTHORIZED)
        
        otp_entry.is_verified = True
        otp_entry.verified_at = timezone.now()
        otp_entry.save()

        user_found = False
        for emp in Employees.objects.all():
            if normalize_phone(emp.contact) == normalized_input:
                user_found = True
                emp.status = 'Inactive' if action == 'deactivate' else 'Active'
                emp.save()
                break

        if not user_found:
            return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'success': True, 'message': f"Account {action}d successfully"})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)