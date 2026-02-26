from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
from core.models import Leaves, Employees
from .serializers import LeavesSerializer
from django.db.models import Q, Sum
import datetime
import threading

from django.utils import timezone
from .utils import is_employee_admin, ADMIN_ROLES

@api_view(['GET'])

def get_leaves(request, employee_id):
    if employee_id == 'MW-DEMO' or employee_id == '999':
        return Response([])
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    leaves = Leaves.objects.filter(employee=employee).order_by('-created_at')
    serializer = LeavesSerializer(leaves, many=True)
    return Response(serializer.data)


def restore_balance_v2(emp, leave_type_code, days):
    """Utility to restore leave balance in EmployeeLeaveBalance table."""
    try:
        from core.models import EmployeeLeaveBalance, LeaveType
        from datetime import datetime as dt_cls
        current_year = dt_cls.now().year
        leave_type = LeaveType.objects.filter(code=leave_type_code.upper()).first()
        if leave_type:
            bal = EmployeeLeaveBalance.objects.filter(
                employee=emp, leave_type=leave_type, year=current_year
            ).first()
            if bal:
                bal.allocated_days = bal.allocated_days + days
                bal.save()
                print(f"DEBUG: [V2] Restored {days} day(s) of {leave_type_code} for {emp.employee_id}")
    except Exception as be:
        print(f"DEBUG: [V2] Could not restore balance: {be}")


def process_leave_notifications(employee, leave_request, notify_to_str, leave_type, from_date, to_date, days, reason, from_session='Full Day', to_session='Full Day'):
    try:
        from .utils import send_email_via_api
        
        # 1. Gather recipients based ONLY on manually selected 'Notify To' field
        recipient_emails = set()

        # 2. Parse notifyTo names (if any were manually added/remained)
        if notify_to_str:
            names = [n.strip() for n in notify_to_str.split(',') if n.strip()]
            for name in names:
                parts = name.split()
                if len(parts) >= 2:
                    target = Employees.objects.filter(
                        first_name__icontains=parts[0],
                        last_name__icontains=parts[-1]
                    ).first()
                    if target and target.email:
                        recipient_emails.add(target.email.strip())
                elif len(parts) == 1:
                    target = Employees.objects.filter(
                        Q(first_name__icontains=parts[0]) | Q(last_name__icontains=parts[0])
                    ).first()
                    if target and target.email:
                        recipient_emails.add(target.email.strip())

        # Filter out employee's own email if present
        if employee.email:
            recipient_emails.discard(employee.email.strip())

        # If no recipients found, log and return
        if not recipient_emails:
            print(f"No recipients found for leave notification for {employee.first_name} {employee.last_name}")
            return

        recipient_emails = list(recipient_emails)
        print(f"DEBUG: Sending leave notification for {employee.employee_id} to {len(recipient_emails)} recipients: {recipient_emails}")

        # Send HTML Email
        subject = f"Leave Request - {employee.first_name} {employee.last_name}({employee.employee_id})"
        
        leave_display_names = {
            'cl': 'Casual Leave',
            'sl': 'Sick Leave',
            'el': 'Earned Leave',
            'scl': 'Special Casual Leave',
            'bl': 'Bereavement Leave',
            'pl': 'Paternity Leave',
            'll': 'Long Leave',
            'co': 'Comp Off'
        }
        leave_name = leave_display_names.get(leave_type, leave_type.upper())
        
        # Action Links - prioritize environment variable, fallback to auto-detection
        import os
        # Production domain
        base_url = os.getenv('FRONTEND_BASE_URL', 'https://hr.markwave.ai')
        api_base = f"{base_url}/api" if not base_url.endswith('/api') else base_url
        
        approve_url = f"{api_base}/leaves/email-action/{leave_request.id}/approve/"
        reject_url = f"{api_base}/leaves/email-action/{leave_request.id}/reject/"

        # Format dates for display
        formatted_from = datetime.datetime.strptime(from_date, '%Y-%m-%d').strftime('%d-%m-%Y')
        formatted_to = datetime.datetime.strptime(to_date, '%Y-%m-%d').strftime('%d-%m-%Y')
        
        body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr>
            <td style="background-color: #48327d; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Leave Application</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hello,</p>
                <p style="font-size: 15px; color: #333333; margin: 0 0 25px 0;">
                    <strong>{employee.first_name} {employee.last_name} ({employee.employee_id})</strong> has submitted a new leave request.
                </p>
                
                <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                    <tr>
                        <td style="color: #666666; font-size: 13px; font-weight: bold;">TYPE:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">{leave_name}</td>
                    </tr>
                    <tr>
                        <td style="color: #666666; font-size: 13px; font-weight: bold;">PERIOD:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">
                            {formatted_from} ({from_session}) to {formatted_to} ({to_session})
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #666666; font-size: 13px; font-weight: bold;">TOTAL DAYS:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">{days} Day(s)</td>
                    </tr>
                    <tr>
                        <td style="color: #666666; font-size: 13px; font-weight: bold; vertical-align: top;">REASON:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">{reason}</td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                        <td align="center">
                            <a href="{approve_url}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 5px;">APPROVE</a>
                            <a href="{reject_url}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 5px;">REJECT</a>
                        </td>
                    </tr>
                </table>
                
                <p style="font-size: 12px; color: #999999; text-align: center; margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                    <strong>This email notification regarding the leave request has been sent only to the designated approver.</strong><br>
                    Only the assigned person is required to review and take action.<br><br>
                    If you are not the intended recipient, please ignore this email.<br>
                    Clicking Approve or Reject will immediately update the leave status.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>"""
        
        # Send individual emails to each selected recipient (no CC)
        for recipient_email in recipient_emails:
            success, result = send_email_via_api(recipient_email, subject, body)
            if success:
                print(f"Successfully sent leave request notification to {recipient_email}")
            else:
                print(f"Failed to send leave request notification to {recipient_email}: {result}")
    except Exception as e:
        print(f"Error in background notification task: {str(e)}")

def notify_employee_status_update(leave_request_id):
    try:
        from .utils import send_email_via_api
        from core.models import Leaves
        
        print(f"DEBUG: notify_employee_status_update called for ID {leave_request_id}")
        
        # Fetch fresh object inside the thread to avoid lazy loading issues
        try:
            leave_request = Leaves.objects.get(pk=leave_request_id)
        except Leaves.DoesNotExist:
            print(f"ERROR: Leave request {leave_request_id} not found in thread")
            return

        employee = leave_request.employee
        
        print(f"DEBUG: Found leave request {leave_request.id}. Employee: {employee.first_name} {employee.last_name} ({employee.employee_id})")
        
        if not employee.email:
            print(f"DEBUG: Skipping notification: No email found for employee {employee.first_name} {employee.last_name}")
            return
        
        # Sanitize email
        employee_email = employee.email.strip()
        print(f"DEBUG: Employee Email: '{employee_email}' (original: '{employee.email}')")

        status_text = leave_request.status
        color = "#10b981" if status_text == 'Approved' else "#ef4444"
        
        leave_display_names = {
            'cl': 'Casual Leave',
            'sl': 'Sick Leave',
            'el': 'Earned Leave',
            'scl': 'Special Casual Leave',
            'bl': 'Bereavement Leave',
            'pl': 'Paternity Leave',
            'll': 'Long Leave',
            'co': 'Comp Off'
        }
        leave_name = leave_display_names.get(leave_request.type, str(leave_request.type).upper())
        
        # Parse dates from strings if they are not already date objects
        from_date = leave_request.from_date
        to_date = leave_request.to_date
        
        # In the model, these are CharFields ('YYYY-MM-DD')
        if isinstance(from_date, str):
            try:
                from_date = datetime.datetime.strptime(from_date, '%Y-%m-%d')
            except:
                pass
        if isinstance(to_date, str):
            try:
                to_date = datetime.datetime.strptime(to_date, '%Y-%m-%d')
            except:
                pass

        subject = f"Leave Request {status_text} - {leave_name}"
        
        # Helper to format date if it's a date object
        def fmt_date(d):
            if hasattr(d, 'strftime'):
                return d.strftime('%d-%m-%Y')
            return str(d)

        body = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
        <td style="background-color: {color}; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Leave Request {status_text}</h1>
        </td>
    </tr>
    <tr>
        <td style="padding: 30px;">
            <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hello {employee.first_name},</p>
            <p style="font-size: 15px; color: #333333; margin: 0 0 25px 0;">
                Your leave request has been <strong>{status_text.lower()}</strong>.
            </p>
            
            <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <tr>
                    <td style="color: #666666; font-size: 13px; font-weight: bold;">TYPE:</td>
                    <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">{leave_name}</td>
                </tr>
                <tr>
                    <td style="color: #666666; font-size: 13px; font-weight: bold;">PERIOD:</td>
                    <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">
                        {fmt_date(from_date)} to {fmt_date(to_date)}
                    </td>
                </tr>
                <tr>
                    <td style="color: #666666; font-size: 13px; font-weight: bold;">STATUS:</td>
                    <td style="color: {color}; font-size: 14px; font-weight: bold; text-align: right;">{status_text.upper()}</td>
                </tr>
            </table>
            
            <p style="font-size: 12px; color: #999999; text-align: center; margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                This is an automated notification from the Markwave HR Portal.
            </p>
        </td>
    </tr>
</table>
</body>
</html>"""
        print(f"DEBUG: Sending email to {employee_email}")
        try:
            success, result = send_email_via_api(employee_email, subject, body)
            if success:
                print(f"DEBUG: Successfully sent leave status update to {employee_email}. Result: {result}")
            else:
                print(f"DEBUG: Failed to send leave status update to {employee_email}: {result}")
        except Exception as api_err:
            print(f"DEBUG: Exception calling send_email_via_api: {str(api_err)}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"DEBUG: Error sending employee leave notification: {str(e)}")
        import traceback
        traceback.print_exc()

@api_view(['POST'])
def apply_leave(request):
    try:
        data = request.data
        employee_id = data.get('employeeId')
        from_date = data.get('fromDate')
        to_date = data.get('toDate')
        leave_type = data.get('type')
        days = data.get('days')

        # Lookup employee
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        if not employee:
            return Response({'error': f'Employee with ID {employee_id} not found'}, status=status.HTTP_404_NOT_FOUND)

        from core.models import LeaveType, EmployeeLeaveBalance, Holidays, WorkFromHome
        from datetime import datetime
        
        current_year = datetime.now().year

        # Roles treated as admin (must match frontend App.tsx isAdmin logic)


        # Validate that leave dates are not in the past (skip for admins)
        from_date_obj = datetime.strptime(from_date, '%Y-%m-%d')
        to_date_obj = datetime.strptime(to_date, '%Y-%m-%d')
        today = datetime.now().date()
        is_admin_check = is_employee_admin(employee)
        
        if not is_admin_check:
            # Allow past dates ONLY if they are within the current month
            current_month_start = today.replace(day=1)
            if from_date_obj.date() < current_month_start or to_date_obj.date() < current_month_start:
                return Response({
                    'error': 'Leave requests for previous months are not allowed. Please select a date in the current month or future.'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Validate each date in the range for Sundays or public holidays
        from datetime import timedelta
        
        # Get all holidays for validation
        all_holidays = Holidays.objects.all()
        holiday_dict = {}
        for holiday in all_holidays:
            try:
                holiday_date = datetime.strptime(holiday.date, '%Y-%m-%d').date()
                holiday_dict[holiday_date] = holiday.name
            except (ValueError, TypeError):
                continue

        current_date = from_date_obj.date()
        while current_date <= to_date_obj.date():
            # Check if it's a Sunday (weekday() returns 6 for Sunday)
            if current_date.weekday() == 6:
                formatted_date = current_date.strftime('%B %d, %Y')
                return Response({
                    'error': f'Leave requests are not allowed on Sundays. {formatted_date} is a Sunday.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if it's a public holiday
            if current_date in holiday_dict:
                formatted_date = current_date.strftime('%B %d, %Y')
                holiday_name = holiday_dict[current_date]
                return Response({
                    'error': f'Leave requests are not allowed on public holidays. {formatted_date} is {holiday_name}.'
                }, status=status.HTTP_400_BAD_REQUEST)

            current_date += timedelta(days=1)

        # Check for overlapping leaves
        existing_overlap = Leaves.objects.filter(
            employee=employee,
            status__in=['Pending', 'Approved'],
            from_date__lte=to_date,
            to_date__gte=from_date
        ).first()

        if existing_overlap:
            return Response({'error': 'Leave already applied for this date range'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for overlapping WFH requests (Mutual Exclusivity)
        existing_wfh_overlap = WorkFromHome.objects.filter(
            employee=employee,
            status__in=['Pending', 'Approved'],
            from_date__lte=to_date,
            to_date__gte=from_date
        ).exists()

        if existing_wfh_overlap:
             return Response({'error': 'You have already applied for Work From Home for this date range. Please cancel it first.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check eligibility based on tenure
        leave_code_upper = leave_type.upper()
        
        # Calculate tenure
        tenure_years = 0
        if employee.joining_date:
            from datetime import date
            today = date.today()
            tenure_days = (today - employee.joining_date).days
            tenure_years = tenure_days / 365.25
        
        # Eligibility rules based on policy
        eligibility_rules = {
            'EL': {'min_years': 2, 'message': 'Earned Leave requires 240 days attendance or 2 years of work experience.'},
            'SCL': {'min_years': 2, 'message': 'Special Casual Leave is only for employees who have completed 2 years.'},
            'LL': {'min_years': 5, 'message': 'Long Leave is only for employees who have completed 5 years.'}
        }
        
        if leave_code_upper in eligibility_rules:
            rule = eligibility_rules[leave_code_upper]
            if tenure_years < rule['min_years']:
                return Response({'error': rule['message']}, status=status.HTTP_400_BAD_REQUEST)

        # Check Leave Balance using new system
        # Get allocated days for this leave type
        balance_record = EmployeeLeaveBalance.objects.filter(
            employee=employee,
            leave_type__code=leave_code_upper,
            year=current_year
        ).select_related('leave_type').first()
        
        # LWP is always available when other leaves are insufficient
        if leave_code_upper == 'LWP':
            # No balance check for LWP - it's unlimited
            pass
        elif balance_record:
            allocated = balance_record.allocated_days
            used_days = Leaves.objects.filter(
                employee=employee,
                type=leave_type,
                status__in=['Pending', 'Approved']
            ).aggregate(total=Sum('days'))['total'] or 0
            
            if used_days + days > allocated:
                return Response({'error': 'Insufficient leave balance. You cannot apply for more leave than your available balance.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # If no balance record exists and it's not LWP, deny
            return Response({'error': f'You do not have allocation for {leave_code_upper}. Please contact HR.'}, status=status.HTTP_400_BAD_REQUEST)

        # Auto-approve if the applicant is an Admin or admin-equivalent role
        is_admin = is_employee_admin(employee)
        initial_status = 'Approved' if is_admin else 'Pending'

        new_request = Leaves.objects.create(
            employee=employee,
            type=leave_type,
            from_date=from_date,
            to_date=to_date,
            days=days,
            reason=data.get('reason', ''),
            from_session=data.get('from_session', 'Full Day'),
            to_session=data.get('to_session', 'Full Day'),
            status=initial_status,
            created_at=timezone.now()
        )

        # Offload notification to background thread (skip for admin auto-approvals)
        if not is_admin:
            notify_to_str = data.get('notifyTo', '')
            threading.Thread(
                target=process_leave_notifications,
                args=(employee, new_request, notify_to_str, leave_type, from_date, to_date, days, data.get('reason', 'N/A'), data.get('from_session', 'Full Day'), data.get('to_session', 'Full Day'))
            ).start()
        else:
            # For admins, trigger the "Approved" notification immediately
            threading.Thread(target=notify_employee_status_update, args=(new_request.id,)).start()

        msg = 'Leave request auto-approved' if is_admin else 'Leave request submitted'
        return Response({'message': msg, 'id': new_request.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def email_leave_action(request, request_id, action):
    try:
        leave_request = Leaves.objects.get(pk=request_id)
        if leave_request.status != 'Pending':
            return HttpResponse(f"""
                <div style="font-family: sans-serif; text-align: center; padding-top: 100px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">ℹ️</div>
                    <h2 style="color: #334155;">Request Already Processed</h2>
                    <p style="color: #64748b;">This leave request has already been marked as <strong>{leave_request.status}</strong>.</p>
                </div>
            """, content_type="text/html")
        
        if action == 'approve':
            leave_request.status = 'Approved'
            status_text = "Approved"
            color = "#10b981"
            icon = "✓"
        elif action == 'reject':
            leave_request.status = 'Rejected'
            status_text = "Rejected"
            color = "#ef4444"
            icon = "✕"
        else:
            return HttpResponse("<h2>Invalid action.</h2>", content_type="text/html")
            
        leave_request.save()
        
        # Notify employee in background
        threading.Thread(target=notify_employee_status_update, args=(leave_request.id,)).start()
        
        html_response = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Leave {status_text}</title>
                <style>
                    body {{
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background-color: #f8fafc;
                        font-family: 'Inter', -apple-system, system-ui, sans-serif;
                    }}
                    .card {{
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                        animation: slideUp 0.5s ease-out;
                    }}
                    @keyframes slideUp {{
                        from {{ transform: translateY(20px); opacity: 0; }}
                        to {{ transform: translateY(0); opacity: 1; }}
                    }}
                    .icon-circle {{
                        width: 80px;
                        height: 80px;
                        background-color: {color};
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 40px;
                        margin: 0 auto 24px;
                    }}
                    h1 {{
                        color: #1e293b;
                        margin: 0 0 8px;
                        font-size: 24px;
                        font-weight: 800;
                    }}
                    p {{
                        color: #64748b;
                        margin: 0;
                        font-size: 16px;
                    }}
                    .footer {{
                        margin-top: 32px;
                        padding-top: 24px;
                        border-top: 1px solid #f1f5f9;
                        font-size: 12px;
                        color: #94a3b8;
                    }}
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon-circle">{icon}</div>
                    <h1>Leave {status_text}</h1>
                    <p>The leave request has been successfully updated.</p>
                    <div class="footer">
                        You can close this window now.
                    </div>
                </div>
                <script>
                    setTimeout(function() {{
                        window.close();
                    }}, 3000);
                </script>
            </body>
        </html>
        """
        return HttpResponse(html_response, content_type="text/html")
    except Leaves.DoesNotExist:
        return HttpResponse("<h2>Leave request not found.</h2>", content_type="text/html")
    except Exception as e:
        return HttpResponse(f"<h2>Error: {str(e)}</h2>", content_type="text/html")

@api_view(['GET'])
def get_pending_leaves(request):
    # Roles treated as admin — their leaves are auto-approved and must not appear here
    from datetime import datetime, timedelta
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    # Exclude leaves submitted by admin-equivalent role employees
    leaves = Leaves.objects.filter(
        Q(status='Pending') | Q(status='Approved', from_date__gte=thirty_days_ago) | Q(status='Approved', is_overridden=True)
    ).exclude(
        employee__role__in=[
            r for role in ADMIN_ROLES
            for r in [role, role.title(), role.upper()]
        ]
    ).order_by('-created_at')
    serializer = LeavesSerializer(leaves, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def leave_action(request, request_id):
    try:
        leave_request = Leaves.objects.get(pk=request_id)
    except Leaves.DoesNotExist:
        return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
        
    action = request.data.get('action') # 'Approve' or 'Reject'
    
    print(f"DEBUG: leave_action called for ID {request_id}, action {action}")
    
    if action not in ['Approve', 'Reject', 'Cancel', 'ApproveOverride', 'RejectOverride']:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
    from api.attendance_views import cancel_leave_for_date
    from core.models import Attendance, LeaveOverrideRequest

    if action == 'Approve':
        leave_request.status = 'Approved'
    elif action == 'Reject':
        leave_request.status = 'Rejected'
    elif action == 'Cancel':
        leave_request.status = 'Cancelled'
        # Restore leave balance
        restore_balance_v2(leave_request.employee, leave_request.type, leave_request.days)
        
        # Restore Attendance records for those dates if they were marked as Leave
        try:
            from datetime import datetime, timedelta
            current_d = datetime.strptime(leave_request.from_date, '%Y-%m-%d')
            end_d = datetime.strptime(leave_request.to_date, '%Y-%m-%d')
            while current_d <= end_d:
                d_str = current_d.strftime('%Y-%m-%d')
                att = Attendance.objects.filter(employee=leave_request.employee, date=d_str).first()
                if att and att.status in ['On Leave', 'Leave']:
                    att.status = '-'
                    att.save()
                current_d += timedelta(days=1)
        except Exception as e:
            print(f"Error resetting attendance after cancel: {e}")
    elif action == 'ApproveOverride':
        # Admin accepts: treat the check-in/out as valid working attendance for that day.
        # 1. Backfill AttendanceLogs  2. Update Attendance summary  3. Split/cancel the leave
        from datetime import datetime as dt_cls
        from core.models import AttendanceLogs

        overrides = LeaveOverrideRequest.objects.filter(leave=leave_request, status='Pending')
        for ovr in overrides:
            employee = ovr.employee
            date_str = ovr.date

            # --- Backfill AttendanceLogs entries from override times ---
            # Use India time (naive) so timestamps are consistent with normal clock()
            def parse_time_to_datetime(date_s, time_s):
                """Convert 'YYYY-MM-DD' + '09:30 AM' → naive datetime (IST)."""
                try:
                    return dt_cls.strptime(f"{date_s} {time_s}", "%Y-%m-%d %I:%M %p")
                except Exception:
                    return None

            if ovr.check_in:
                check_in_dt = parse_time_to_datetime(date_str, ovr.check_in)
                if check_in_dt and not AttendanceLogs.objects.filter(employee=employee, date=date_str, type='IN').exists():
                    AttendanceLogs.objects.create(
                        employee=employee,
                        timestamp=check_in_dt,
                        type='IN',
                        location=ovr.location_in or '',
                        date=date_str
                    )

            if ovr.check_out:
                check_out_dt = parse_time_to_datetime(date_str, ovr.check_out)
                if check_out_dt and not AttendanceLogs.objects.filter(employee=employee, date=date_str, type='OUT').exists():
                    AttendanceLogs.objects.create(
                        employee=employee,
                        timestamp=check_out_dt,
                        type='OUT',
                        location=ovr.location_out or '',
                        date=date_str
                    )

            # --- Update Attendance summary with real check-in/check-out times ---
            att, _ = Attendance.objects.get_or_create(
                employee=employee,
                date=date_str,
                defaults={'status': 'Present', 'break_minutes': 0}
            )
            att.status = 'Present'
            if ovr.check_in:
                att.check_in = ovr.check_in
            if ovr.check_out:
                att.check_out = ovr.check_out
                # Recalculate worked hours if both times are available
                if ovr.check_in:
                    check_in_dt = parse_time_to_datetime(date_str, ovr.check_in)
                    check_out_dt = parse_time_to_datetime(date_str, ovr.check_out)
                    if check_in_dt and check_out_dt:
                        total_mins = (check_out_dt - check_in_dt).total_seconds() / 60
                        total_mins = max(0, total_mins)
                        h = int(total_mins // 60)
                        m = int(total_mins % 60)
                        att.worked_hours = f"{h}h {m}m"
            att.save()

            # --- Cancel/Split the leave for that date so balance is restored ---
            cancel_leave_for_date(leave_request, ovr.date)

            # Mark override as Approved
            ovr.status = 'Approved'
            ovr.save()

        return Response({'message': 'Leave override approved. Attendance marked as Present.'})

    elif action == 'RejectOverride':
        # Admin rejects: check-in/out is ignored, leave stays approved as-is.
        overrides = LeaveOverrideRequest.objects.filter(leave=leave_request, status='Pending')
        for ovr in overrides:
            att = Attendance.objects.filter(employee=ovr.employee, date=ovr.date).first()
            if att:
                att.status = 'On Leave'
                att.check_in = None
                att.check_out = None
                att.save()
            ovr.status = 'Rejected'
            ovr.save()
        return Response({'message': 'Leave override rejected. Leave remains approved.'})

    leave_request.save()

    
    # Notify employee in background
    try:
        t = threading.Thread(target=notify_employee_status_update, args=(leave_request.id,))
        t.start()
        print(f"DEBUG: Started notification thread {t.name} for leave {leave_request.id}")
    except Exception as e:
        print(f"ERROR: Failed to start notification thread: {e}")
        import traceback
        traceback.print_exc()
    
    return Response({'message': f'Leave request {action}d successfully'})

@api_view(['GET'])
def get_leave_balance(request, employee_id):
    if employee_id == 'MW-DEMO' or employee_id == '999':
        return Response({
            'cl': 5,
            'sl': 5,
            'el': 10,
            'total': 20
        })
    try:
        from core.models import LeaveType, EmployeeLeaveBalance
        from datetime import datetime
        
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        if not employee:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        current_year = datetime.now().year
        
        # Get all leave balances for this employee for current year
        balances = EmployeeLeaveBalance.objects.filter(
            employee=employee,
            year=current_year
        ).select_related('leave_type')
        
        # Calculate used leaves from Leaves table
        used_leaves = Leaves.objects.filter(
            employee=employee,
            status__in=['Pending', 'Approved']
        )
        
        usage = {}
        for leave in used_leaves:
            if leave.type:
                leave_code = leave.type.lower()
                usage[leave_code] = usage.get(leave_code, 0) + leave.days
        
        # Build response with only allocated leave types (allocated_days > 0)
        result = {}
        total_allocated = 0
        total_used = 0
        
        for balance in balances:
            try:
                if not balance.leave_type or not balance.leave_type.code:
                    continue
                    
                code = balance.leave_type.code.lower()
                allocated = balance.allocated_days or 0
                
                # Only include leave types with actual allocation
                if allocated > 0:
                    used = usage.get(code, 0)
                    remaining = max(0, allocated - used)
                    
                    result[code] = remaining
                    total_allocated += allocated
                    total_used += used
            except Exception as e:
                print(f"Error processing balance record {balance.id}: {e}")
                continue
        
        # Only add total if there are any leaves
        if total_allocated > 0:
            result['total'] = max(0, total_allocated - total_used)
        
        return Response(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f"Internal Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
