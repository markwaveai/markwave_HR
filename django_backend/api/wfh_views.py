from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
from core.models import WorkFromHome, Employees, Holidays, Leaves
from .serializers import WorkFromHomeSerializer
from django.db.models import Q
import datetime
import threading
from django.utils import timezone
import os
from .utils import send_email_via_api, is_employee_admin

def send_wfh_notification_to_manager(employee, wfh_request, reason, notify_to_str=""):
    try:
        from .utils import send_email_via_api
        
        # 1. Gather recipients based ONLY on manually selected 'Notify To' field
        recipient_emails = set()

        # 2. Parse notifyTo names (if any were manually added)
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
            print(f"No recipients found for WFH notification for {employee.first_name} {employee.last_name}")
            return

        recipient_emails = list(recipient_emails)
        print(f"DEBUG: Sending WFH notification for {employee.employee_id} to {len(recipient_emails)} recipients: {recipient_emails}")

        subject = f"WFH Request - {employee.first_name} {employee.last_name} ({employee.employee_id})"
        
        # Production domain
        base_url = os.getenv('FRONTEND_BASE_URL', 'https://hr.markwave.ai')
        api_base = f"{base_url}/api" if not base_url.endswith('/api') else base_url
        
        approve_url = f"{api_base}/wfh/email-action/{wfh_request.id}/approve/"
        reject_url = f"{api_base}/wfh/email-action/{wfh_request.id}/reject/"

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
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">WFH Application</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px;">
                <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hello,</p>
                <p style="font-size: 15px; color: #333333; margin: 0 0 25px 0;">
                    <strong>{employee.first_name} {employee.last_name} ({employee.employee_id})</strong> has requested to Work From Home.
                </p>
                
                <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                    <tr>
                        <td style="color: #666666; font-size: 13px; font-weight: bold;">PERIOD:</td>
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">
                            {wfh_request.from_date} to {wfh_request.to_date}
                        </td>
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
                    <strong>This email notification regarding the Work From Home request has been sent only to the designated approver.</strong><br>
                    Only the assigned person is required to review and take action.<br><br>
                    If you are not the intended recipient, please ignore this email.<br>
                    Clicking Approve or Reject will immediately update the WFH status.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>"""
        
        
        # Send individual emails to each selected recipient (no CC)
        for recipient_email in recipient_emails:
            send_email_via_api(recipient_email, subject, body)


    except Exception as e:
        print(f"Error sending WFH notification: {str(e)}")

def send_wfh_status_notification_to_employee(wfh_request):
    try:
        employee = wfh_request.employee
        if not employee.email:
            return

        status_text = wfh_request.status
        color = "#10b981" if status_text == 'Approved' else "#ef4444"
        
        subject = f"WFH Request Update - {status_text}"
        
        body = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
    <h2>WFH Request {status_text}</h2>
    <p>Your Work From Home request has been <strong style="color: {color};">{status_text.lower()}</strong>.</p>
    <p><strong>Dates:</strong> {wfh_request.from_date} to {wfh_request.to_date}</p>
</body>
</html>"""

        send_email_via_api(employee.email, subject, body)

    except Exception as e:
        print(f"Error sending employee notification: {str(e)}")

@api_view(['POST'])
def apply_wfh(request):
    try:
        data = request.data
        employee_id = data.get('employeeId')
        from_date = data.get('fromDate')
        to_date = data.get('toDate')
        reason = data.get('reason', '')
        notify_to = data.get('notifyTo', '')

        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        if not employee:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        # Parse dates
        try:
            start_date = datetime.datetime.strptime(from_date, '%Y-%m-%d').date()
            end_date = datetime.datetime.strptime(to_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Please use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate date range
        if end_date < start_date:
            return Response({'error': 'End date cannot be before start date.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate that wfh dates are not in previous months (skip for admins)
        is_admin = is_employee_admin(employee)

        if not is_admin:
            today = datetime.date.today()
            current_month_start = today.replace(day=1)
            if start_date < current_month_start or end_date < current_month_start:
                 return Response({
                    'error': 'WFH requests for previous months are not allowed. Please select a date in the current month or future.'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Get all holidays for validation
        all_holidays = Holidays.objects.all()
        holiday_dict = {}
        for holiday in all_holidays:
            try:
                holiday_date = datetime.datetime.strptime(holiday.date, '%Y-%m-%d').date()
                holiday_dict[holiday_date] = holiday.name
            except ValueError:
                continue

        # Validate each date in the range
        current_date = start_date
        while current_date <= end_date:
            # Check if it's a Sunday (weekday() returns 6 for Sunday)
            if current_date.weekday() == 6:
                formatted_date = current_date.strftime('%B %d, %Y')
                return Response({
                    'error': f'WFH requests are not allowed on Sundays. {formatted_date} is a Sunday.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if it's a public holiday
            if current_date in holiday_dict:
                formatted_date = current_date.strftime('%B %d, %Y')
                holiday_name = holiday_dict[current_date]
                return Response({
                    'error': f'WFH requests are not allowed on public holidays. {formatted_date} is {holiday_name}.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check for duplicate/overlapping WFH requests
            # Check if there's any existing WFH request that includes this date
            existing_requests = WorkFromHome.objects.filter(
                employee=employee
            )
            
            for existing in existing_requests:
                try:
                    existing_start = datetime.datetime.strptime(existing.from_date, '%Y-%m-%d').date()
                    existing_end = datetime.datetime.strptime(existing.to_date, '%Y-%m-%d').date()
                    
                    # Check if current_date falls within any existing request
                    if existing_start <= current_date <= existing_end:
                        formatted_date = current_date.strftime('%B %d, %Y')
                        return Response({
                            'error': f'You already have a WFH request for {formatted_date}. Please check your WFH history.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    continue

            current_date += datetime.timedelta(days=1)

        # Check for overlapping Leave requests (Mutual Exclusivity)
        existing_leave_overlap = Leaves.objects.filter(
            employee=employee,
            status__in=['Pending', 'Approved'],
            from_date__lte=to_date,
            to_date__gte=from_date
        ).exists()

        if existing_leave_overlap:
             return Response({'error': 'You have already applied for Leave for this date range. Please cancel it first.'}, status=status.HTTP_400_BAD_REQUEST)


        # Auto-approve if the applicant is an Admin or admin-equivalent role
        is_admin = is_employee_admin(employee)
        initial_status = 'Approved' if is_admin else 'Pending'

        # All validations passed, create the WFH request
        new_request = WorkFromHome.objects.create(
            employee=employee,
            from_date=from_date,
            to_date=to_date,
            reason=reason,
            status=initial_status
        )

        # Notify Manager/Admin (skip for admin auto-approvals)
        if not is_admin:
            threading.Thread(target=send_wfh_notification_to_manager, args=(employee, new_request, reason, notify_to)).start()

        msg = 'WFH request auto-approved' if is_admin else 'WFH request submitted'
        return Response({'message': msg, 'id': new_request.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_wfh_requests(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee:
        # Try finding by PK if employee_id is not found directly
        if str(employee_id).isdigit():
             employee = Employees.objects.filter(pk=employee_id).first()

    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    requests = WorkFromHome.objects.filter(employee=employee).order_by('-created_at')
    serializer = WorkFromHomeSerializer(requests, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_pending_wfh(request):
    requests = WorkFromHome.objects.filter(status='Pending').order_by('-created_at')
    serializer = WorkFromHomeSerializer(requests, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def wfh_action(request, request_id):
    try:
        wfh_request = WorkFromHome.objects.get(pk=request_id)
    except WorkFromHome.DoesNotExist:
        return Response({'error': 'WFH request not found'}, status=status.HTTP_404_NOT_FOUND)
        
    action = request.data.get('action') # 'Approve' or 'Reject'
    if action not in ['Approve', 'Reject']:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
    wfh_request.status = 'Approved' if action == 'Approve' else 'Rejected'
    wfh_request.save()

    # Notify Employee
    threading.Thread(target=send_wfh_status_notification_to_employee, args=(wfh_request,)).start()
    
    return Response({'message': f'WFH request {action}d successfully'})

@api_view(['GET'])
def email_wfh_action(request, request_id, action):
    try:
        wfh_request = WorkFromHome.objects.get(pk=request_id)
        
        if wfh_request.status != 'Pending':
            return HttpResponse(f"""
                <div style="font-family: sans-serif; text-align: center; padding-top: 100px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">ℹ️</div>
                    <h2 style="color: #334155;">Request Already Processed</h2>
                    <p style="color: #64748b;">This WFH request has already been marked as <strong>{wfh_request.status}</strong>.</p>
                </div>
            """, content_type="text/html")

        if action == 'approve':
            wfh_request.status = 'Approved'
            status_text = "Approved"
            color = "#10b981"
            icon = "✓"
        elif action == 'reject':
            wfh_request.status = 'Rejected'
            status_text = "Rejected"
            color = "#ef4444"
            icon = "✕"
        else:
            return HttpResponse("<h2>Invalid action.</h2>", content_type="text/html")
            
        wfh_request.save()
        
        # Notify Employee
        threading.Thread(target=send_wfh_status_notification_to_employee, args=(wfh_request,)).start()

        html_response = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>WFH {status_text}</title>
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
                    <h1>WFH {status_text}</h1>
                    <p>The WFH request has been successfully updated.</p>
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
    except WorkFromHome.DoesNotExist:
        return HttpResponse("<h2>Request not found.</h2>", content_type="text/html")
    except Exception as e:
        return HttpResponse(f"<h2>Error: {str(e)}</h2>", content_type="text/html")
