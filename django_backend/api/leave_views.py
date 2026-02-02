from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Leaves, Employees
from .serializers import LeavesSerializer
from django.db.models import Q, Sum
import datetime
import threading

from django.utils import timezone

@api_view(['GET'])
def get_leaves(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    leaves = Leaves.objects.filter(employee=employee).order_by('-created_at')
    serializer = LeavesSerializer(leaves, many=True)
    return Response(serializer.data)

def process_leave_notifications(employee, leave_request, notify_to_str, leave_type, from_date, to_date, days, reason):
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

        # Send HTML Email
        if recipient_emails:
            subject = f"Leave Request - {employee.first_name} {employee.last_name}({employee.employee_id})"
            
            leave_display_names = {
                'cl': 'Casual Leave',
                'sl': 'Sick Leave',
                'el': 'Earned Leave'
            }
            leave_name = leave_display_names.get(leave_type, leave_type.upper())
            
            # Action Links - auto-detect environment
            import os
            django_env = os.getenv('DJANGO_ENV', 'development')
            
            # Use production URL if not in development, otherwise use localhost
            if django_env == 'production':
                base_url = 'https://hr.markwave.ai'
            else:
                base_url = 'http://localhost:8000'
            
            approve_url = f"{base_url}/api/leaves/email-action/{leave_request.id}/approve/"
            reject_url = f"{base_url}/api/leaves/email-action/{leave_request.id}/reject/"

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
                        <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">{formatted_from} to {formatted_to}</td>
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
                    This is an automated notification from MarkwaveHR.<br>
                    Clicking Approve or Reject will immediately update the leave status.
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
        print(f"Error in background notification task: {str(e)}")

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

        LEAVE_LIMITS = {'cl': 6, 'sl': 6, 'el': 17}

        # Check for overlapping leaves
        existing_overlap = Leaves.objects.filter(
            employee=employee,
            status__in=['Pending', 'Approved'],
            from_date__lte=to_date,
            to_date__gte=from_date
        ).first()

        if existing_overlap:
            return Response({'error': 'Leave already applied for this date range'}, status=status.HTTP_400_BAD_REQUEST)

        # Check Leave Balance
        if leave_type in LEAVE_LIMITS:
            limit = LEAVE_LIMITS[leave_type]
            used_days = Leaves.objects.filter(
                employee=employee,
                type=leave_type,
                status__in=['Pending', 'Approved']
            ).aggregate(total=Sum('days'))['total'] or 0
            
            if used_days + days > limit:
                 return Response({'error': 'Insufficient leave balance. You cannot apply for more leave than your available balance.'}, status=status.HTTP_400_BAD_REQUEST)

        new_request = Leaves.objects.create(
            employee=employee,
            type=leave_type,
            from_date=from_date,
            to_date=to_date,
            days=days,
            reason=data.get('reason', ''),
            status='Pending',
            created_at=timezone.now()
        )

        # Offload notification to background thread
        notify_to_str = data.get('notifyTo', '')
        threading.Thread(
            target=process_leave_notifications,
            args=(employee, new_request, notify_to_str, leave_type, from_date, to_date, days, data.get('reason', 'N/A'))
        ).start()

        return Response({'message': 'Leave request submitted', 'id': new_request.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def email_leave_action(request, request_id, action):
    try:
        leave_request = Leaves.objects.get(pk=request_id)
        if leave_request.status != 'Pending':
            return Response("<html><body><h2 style='text-align:center;margin-top:50px;'>This request has already been processed.</h2></body></html>", content_type="text/html")
        
        if action == 'approve':
            leave_request.status = 'Approved'
            status_text = "Approved"
        elif action == 'reject':
            leave_request.status = 'Rejected'
            status_text = "Rejected"
        else:
            return Response("<html><body><h2>Invalid action.</h2></body></html>", content_type="text/html")
            
        leave_request.save()
        
        html_response = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background: {'#10b981' if action == 'approve' else '#ef4444'};
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    }}
                    .message {{
                        text-align: center;
                        color: white;
                    }}
                    .icon {{
                        font-size: 64px;
                        margin-bottom: 10px;
                    }}
                    .text {{
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }}
                    .subtext {{
                        font-size: 14px;
                        opacity: 0.9;
                    }}
                </style>
                <script>
                    setTimeout(function() {{
                        window.close();
                        // Fallback: redirect to a blank page if close doesn't work
                        setTimeout(function() {{
                            window.location.href = 'about:blank';
                        }}, 100);
                    }}, 1000);
                </script>
            </head>
            <body>
                <div class="message">
                    <div class="icon">{'✓' if action == 'approve' else '✗'}</div>
                    <div class="text">{status_text}</div>
                    <div class="subtext">Closing...</div>
                </div>
            </body>
        </html>
        """
        return Response(html_response, content_type="text/html")
    except Leaves.DoesNotExist:
        return Response("<html><body><h2 style='text-align:center;margin-top:50px;'>Leave request not found.</h2></body></html>", content_type="text/html")
    except Exception as e:
        return Response(f"<html><body><h2>Error: {str(e)}</h2></body></html>", content_type="text/html")

@api_view(['GET'])
def get_pending_leaves(request):
    leaves = Leaves.objects.filter(status='Pending').order_by('-created_at')
    serializer = LeavesSerializer(leaves, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def leave_action(request, request_id):
    try:
        leave_request = Leaves.objects.get(pk=request_id)
    except Leaves.DoesNotExist:
        return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
        
    action = request.data.get('action') # 'Approve' or 'Reject'
    if action not in ['Approve', 'Reject']:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
    leave_request.status = 'Approved' if action == 'Approve' else 'Rejected'
    leave_request.save()
    
    return Response({'message': f'Leave request {action}d successfully'})

@api_view(['GET'])
def get_leave_balance(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    LEAVE_LIMITS = {'cl': 6, 'sl': 6, 'el': 17}
    
    used_leaves = Leaves.objects.filter(
        employee=employee,
        status__in=['Pending', 'Approved']
    )
    
    usage = {'cl': 0, 'sl': 0, 'el': 0}
    for l in used_leaves:
        if l.type in usage:
            usage[l.type] += l.days

    balance = {
        'cl': max(0, LEAVE_LIMITS['cl'] - usage['cl']),
        'sl': max(0, LEAVE_LIMITS['sl'] - usage['sl']),
        'el': max(0, LEAVE_LIMITS['el'] - usage['el']),
    }
    balance['total'] = balance['cl'] + balance['sl'] + balance['el']
    
    return Response(balance)
