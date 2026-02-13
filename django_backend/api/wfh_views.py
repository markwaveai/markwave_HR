from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
from core.models import WorkFromHome, Employees
from .serializers import WorkFromHomeSerializer
from django.db.models import Q
import datetime
import threading
from django.utils import timezone
from .utils import send_email_via_api
import os

def send_wfh_notification_to_manager(employee, wfh_request, reason, notify_to_str=""):
    try:
        from .utils import send_email_via_api
        
        # Parse notifyTo names and find emails
        recipient_emails = []
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
                        recipient_emails.append(target.email)
                elif len(parts) == 1:
                    target = Employees.objects.filter(
                        Q(first_name__icontains=parts[0]) | Q(last_name__icontains=parts[0])
                    ).first()
                    if target and target.email:
                        recipient_emails.append(target.email)

        # Fallback to Admin if no recipients found
        if not recipient_emails:
            admin = Employees.objects.filter(role__icontains='Admin').first()
            if admin and admin.email:
                recipient_emails.append(admin.email)

        if not recipient_emails:
            print("No recipient emails found for WFH notification")
            return

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
                    This is an automated notification from MarkwaveHR.<br>
                    Clicking Approve or Reject will immediately update the WFH status.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>"""
        
        main_recipient = recipient_emails[0]
        cc_list = recipient_emails[1:] if len(recipient_emails) > 1 else []
        send_email_via_api(main_recipient, subject, body, cc_emails=cc_list)

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

        new_request = WorkFromHome.objects.create(
            employee=employee,
            from_date=from_date,
            to_date=to_date,
            reason=reason,
            status='Pending'
        )

        # Notify Manager/Admin
        threading.Thread(target=send_wfh_notification_to_manager, args=(employee, new_request, reason, notify_to)).start()

        return Response({'message': 'WFH request submitted', 'id': new_request.id}, status=status.HTTP_201_CREATED)
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
