import requests
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Attendance, AttendanceLogs, Leaves, Regularization, Teams, Holidays
from datetime import datetime, timedelta
from django.db.models import Q
import pytz
import threading
from .utils import send_email_via_api
from django.core.cache import cache

def process_regularization_email(target_email, subject, title, message, color="#48327d", icon="📅"):
    try:
        html_response = f"""
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 20px; margin: 0;">
                <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 20px;">{icon}</div>
                    <h1 style="color: {color}; font-size: 20px; font-weight: 700; margin-bottom: 16px; margin-top: 0;">{title}</h1>
                    <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">{message}</p>
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                        MarkwaveHR Automated Notification
                    </div>
                </div>
            </body>
        </html>
        """
        send_email_via_api(target_email, subject, html_response)
    except Exception as e:
        print(f"Error sending regularization email: {e}")




def notify_leave_override(employee, leave_obj, date_str):
    try:
        subject = f"Leave Override Alert - {employee.first_name} {employee.last_name}"
        title = "Employee Checked In During Leave"
        message = f"""
        <b>{employee.first_name} {employee.last_name} ({employee.employee_id})</b> has checked in on <b>{date_str}</b>.<br><br>
        This date falls under an <b>Approved Leave</b> ({leave_obj.type}).<br>
        The system has marked the attendance as Present, but the Leave remains Approved.<br><br>
        Please review and manually cancel the leave if necessary to adjust the leave balance.
        """
        
        # Notify Managers
        recipients = set()
        for team in employee.teams.all():
            if team.manager and team.manager.email:
                recipients.add(team.manager.email)
        
        # Notify Admins (optional, can be noisy)
        # admins = Employees.objects.filter(is_admin=True)
        # for admin in admins:
        #     if admin.email: recipients.add(admin.email)

        for email in recipients:
            process_regularization_email(email, subject, title, message, color="#f59e0b", icon="⚠️")
            
    except Exception as e:
        print(f"Error sending leave override notification: {e}")


def cancel_leave_for_date(leave_obj, target_date_str):
    """
    Cancels or splits a leave request because the user clocked in on 'target_date_str'.
    """
    try:
        from api.leave_views import notify_employee_status_update
        
        target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        from_date = datetime.strptime(leave_obj.from_date, '%Y-%m-%d').date()
        to_date = datetime.strptime(leave_obj.to_date, '%Y-%m-%d').date()
        
        print(f"DEBUG: Process Leave Override | Leave ID: {leave_obj.id} [{from_date} to {to_date}] | Target: {target_date}")

        # CASE 1: Single Day Leave (or start=end for some reason)
        if from_date == to_date:
            if from_date == target_date:
                print("DEBUG: Cancelling single day leave.")
                leave_obj.status = 'Cancelled'
                # leave_obj.days = 0 
                leave_obj.save()
                # Notify
                threading.Thread(target=notify_employee_status_update, args=(leave_obj.id,)).start()
                return

        # CASE 2: Multi-day Leave - SPLIT
        
        # Subcase A: Target is the START date
        if target_date == from_date:
            print("DEBUG: Trimming start of leave.")
            new_from = from_date + timedelta(days=1)
            leave_obj.from_date = new_from.strftime('%Y-%m-%d')
            # approx recalc: days = days - 1
            leave_obj.days = max(0, leave_obj.days - 1) 
            leave_obj.save()
            return

        # Subcase B: Target is the END date
        if target_date == to_date:
            print("DEBUG: Trimming end of leave.")
            new_to = to_date - timedelta(days=1)
            leave_obj.to_date = new_to.strftime('%Y-%m-%d')
            leave_obj.days = max(0, leave_obj.days - 1)
            leave_obj.save()
            return
            
        # Subcase C: Target is in the MIDDLE
        if from_date < target_date < to_date:
            print("DEBUG: Splitting leave into two.")
            # 1. Shrink existing leave to end before target
            original_to = leave_obj.to_date # Keep for Part 2
            
            # Update Part 1 (Current Object) -> From Start to Target-1
            part1_end = target_date - timedelta(days=1)
            leave_obj.to_date = part1_end.strftime('%Y-%m-%d')
            
            # Calc days for Part 1: (part1_end - from_date).days + 1
            leave_obj.days = (part1_end - from_date).days + 1
            leave_obj.save()
            
            # 2. Create Part 2 -> From Target+1 to End
            part2_start = target_date + timedelta(days=1)
            part2_start_str = part2_start.strftime('%Y-%m-%d')
            
            # Days for Part 2
            original_to_date = datetime.strptime(original_to, '%Y-%m-%d').date()
            days_part2 = (original_to_date - part2_start).days + 1
            
            # Create new Leave object
            Leaves.objects.create(
                employee=leave_obj.employee,
                type=leave_obj.type,
                from_date=part2_start_str,
                to_date=original_to,
                days=days_part2,
                reason=f"{leave_obj.reason} (Split due to check-in on {target_date_str})",
                status='Approved', # Auto-approve the remainder
                created_at=leave_obj.created_at # Keep original timestamp
            )
            return

    except Exception as e:
        print(f"ERROR: Failed to cancel/split leave: {e}")
        import traceback
        traceback.print_exc()

@api_view(['GET'])
def resolve_location(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    if not lat or not lon:
        return Response({'error': 'Lat and Lon are required'}, status=400)
    
    try:
        # Proper User-Agent as per Nominatim Policy
        headers = {'User-Agent': 'MarkwaveHR-System/1.0 (info@markwave.ai)'}
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.ok:
            data = response.json()
            addr = data.get('address', {})
            parts = []
            
            # 1. House Number (for exactness)
            if addr.get('house_number'):
                parts.append(addr.get('house_number'))
                
            # 2. Building / Amenity / Office
            entity = addr.get('office') or addr.get('amenity') or addr.get('building') or addr.get('shop') or addr.get('industrial')
            if entity:
                parts.append(entity)
            
            # 3. Road (Critical for "exact" location)
            if addr.get('road'):
                parts.append(addr.get('road'))

            # 4. Area / Neighbourhood
            area = addr.get('neighbourhood') or addr.get('suburb') or addr.get('residential')
            if area:
                parts.append(area)
                
            # 5. City / Town
            city = addr.get('city') or addr.get('town') or addr.get('village')
            if city:
                parts.append(city)
                
            name = ", ".join(parts) if parts else data.get('display_name', '').split(',')[0:3]
            if isinstance(name, list): name = ", ".join(name)
            
            return Response({'address': name})
    except Exception as e:
        print(f"Location resolution failed: {e}")
        
    return Response({'address': None})


@api_view(['POST'])
def clock(request):
    data = request.data
    employee_id = data.get('employee_id')
    location = data.get('location')
    clock_type = data.get('type') 
    
    print(f"DEBUG: Clock request received - Emp: {employee_id}, Type: {clock_type}, Location: {location}")
    if not employee_id:
        print("DEBUG: Clock failed - Employee ID missing")
        return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Try lookup by employee_id first (the new standard)
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            # Fallback to internal ID for active sessions that haven't refreshed
            employee = Employees.objects.filter(pk=employee_id).first()
            
        if not employee:
            print(f"DEBUG: Clock failed - Employee {employee_id} not found")
            return Response({'error': f'Employee with ID {employee_id} not found'}, status=status.HTTP_404_NOT_FOUND)
        
        print(f"DEBUG: Clock proceed for {employee.first_name} {employee.last_name}")
    except Exception as e:
        print(f"DEBUG: Clock exception in lookup: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # India Time Adjustment (naive)
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_date_str = india_time.strftime('%Y-%m-%d')
    current_time_str = india_time.strftime('%I:%M %p')
    print(f"DEBUG: India Time Calculated: {india_time}")

    # Check for approved leave (Override logic)
    conflicting_leave = Leaves.objects.filter(
        employee=employee,
        status='Approved',
        from_date__lte=current_date_str,
        to_date__gte=current_date_str
    ).first()
    
    if conflicting_leave:
        print(f"DEBUG: Found conflicting leave {conflicting_leave.id} on {current_date_str}. Allowing Override.")
        # DISABLED: Do not auto-cancel leave.
        # cancel_leave_for_date(conflicting_leave, current_date_str)
        
        # Notify Admin/Manager if this is the first punch of the day to avoid spamming
        first_punch_check = AttendanceLogs.objects.filter(employee=employee, date=current_date_str).exists()
        if not first_punch_check:
             print(f"DEBUG: Sending Leave Override Notification for {employee.employee_id}")
             # Mark leave as overridden so admin can see it in UI
             conflicting_leave.is_overridden = True
             conflicting_leave.save()
             
             threading.Thread(target=notify_leave_override, args=(employee, conflicting_leave, current_date_str)).start()

    last_log_today = AttendanceLogs.objects.filter(employee=employee, date=current_date_str).order_by('-timestamp').first()
    
    if not clock_type:
        if not last_log_today or last_log_today.type == 'OUT':
            clock_type = 'IN'
        else:
            clock_type = 'OUT'

    # Create Log
    new_log = AttendanceLogs.objects.create(
        employee=employee,
        timestamp=india_time,
        type=clock_type,
        location=location,
        date=current_date_str
    )
    
    # Update Attendance Summary
    attendance_summary, created = Attendance.objects.get_or_create(
        employee=employee,
        date=current_date_str,
        defaults={'status': 'Present', 'break_minutes': 0}
    )
    
    if created:
        if Holidays.objects.filter(date=current_date_str).exists():
            attendance_summary.is_holiday = True
    
    # If the record already existed but was marked as something else, update to 'Present'
    if not created and attendance_summary.status in ['Week Off', 'Holiday', 'Absent', '-', None]:
        attendance_summary.status = 'Present'
    
    if clock_type == 'IN':
        if not attendance_summary.check_in:
             attendance_summary.check_in = current_time_str
        elif last_log_today and last_log_today.type == 'OUT':
            break_duration = (india_time - last_log_today.timestamp).total_seconds() / 60
            if attendance_summary.break_minutes is None:
                attendance_summary.break_minutes = 0
            attendance_summary.break_minutes += int(round(break_duration))
        # Clear checkout when clocking back in, so it doesn't show an old checkout time while active
        attendance_summary.check_out = '-'

    elif clock_type == 'OUT':
        # Update summary check_out time
        attendance_summary.check_out = current_time_str
        
        # Recalculate working hours
        first_log = AttendanceLogs.objects.filter(employee=employee, date=current_date_str, type='IN').order_by('timestamp').first()
        if first_log:
            # If summary check_in was missing, populate it from the first log
            if not attendance_summary.check_in or attendance_summary.check_in == '-':
                attendance_summary.check_in = first_log.timestamp.strftime('%I:%M %p')

            total_duration_minutes = (india_time - first_log.timestamp).total_seconds() / 60
            break_mins = attendance_summary.break_minutes or 0
            effective_minutes = max(0, total_duration_minutes - break_mins)
            eff_h = int(effective_minutes // 60)
            eff_m = int(effective_minutes % 60)
            attendance_summary.worked_hours = f"{eff_h}h {eff_m}m"

    attendance_summary.save()
    
    return Response({
        'message': f'Successfully Clocked {clock_type}',
        'type': clock_type,
        'time': current_time_str,
        'summary': {
            'check_in': attendance_summary.check_in,
            'check_out': attendance_summary.check_out,
            'break_minutes': attendance_summary.break_minutes,
            'worked_hours': attendance_summary.worked_hours
        }
    })

@api_view(['GET'])
def get_status(request, employee_id):
    try:
        # Lookup employee to handle both string employee_id and internal ID
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        if not employee:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        current_date_str = now.strftime('%Y-%m-%d')
        
        # Check for holiday first (highest priority)
        holiday_obj = Holidays.objects.filter(date=current_date_str).first()
        is_holiday_db = holiday_obj is not None

        attendance_record = Attendance.objects.filter(
            employee=employee,
            date=current_date_str
        ).first()
        
        is_holiday = is_holiday_db or (attendance_record and attendance_record.is_holiday)
        
        # Check for approved leave (case-insensitive)
        is_on_leave = Leaves.objects.filter(
            employee=employee,
            status__iexact='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).exists()
        
        # Fallback: Check if the attendance record itself is marked as leave
        if not is_on_leave and attendance_record and attendance_record.status:
            if attendance_record.status.lower() in ['on leave', 'leave']:
                is_on_leave = True

        is_weekend = now.weekday() >= 5  # 5=Saturday, 6=Sunday
        
        # Always allow clocking, even on leave/weekend/holiday
        can_clock = True 
        disabled_reason = None
        
        if is_holiday:
            disabled_reason = 'Holiday'
        elif is_on_leave:
            disabled_reason = 'On Leave'
            can_clock = False
        elif is_weekend:
            disabled_reason = 'Week Off'
        else:
            # Check for absent status (no activity after 11 AM on working day)
            has_activity = AttendanceLogs.objects.filter(
                employee=employee,
                date=current_date_str
            ).exists()
            
            current_hour = now.hour
            if not has_activity and current_hour >= 11:
                disabled_reason = 'Absent'
                can_clock = True  # Allow clocking even if initially marked absent (late arrival)

        last_log = AttendanceLogs.objects.filter(employee=employee).order_by('-timestamp').first()
        summary = Attendance.objects.filter(employee=employee, date=current_date_str).first()
        
        att_status = 'OUT'
        # Prioritize summary (Attendance model) as it includes regularized/manual updates
        if summary:
            if summary.check_in and summary.check_in != '-' and (not summary.check_out or summary.check_out == '-'):
                att_status = 'IN'
        # Fallback to logs if summary doesn't exist yet
        elif last_log and last_log.type == 'IN' and last_log.date == current_date_str:
            att_status = 'IN'
            
        return Response({
            'status': att_status,
            'check_in': summary.check_in if summary else '-',
            'check_out': summary.check_out if summary else '-',
            'break_minutes': summary.break_minutes if summary else 0,
            'worked_hours': summary.worked_hours if summary else '-',
            'last_punch': last_log.timestamp.strftime('%I:%M %p') if last_log else None,
            'can_clock': can_clock,
            'disabled_reason': disabled_reason,
            'server_time': now.isoformat()
        })
    except Exception as e:
        import traceback
        return Response({'error': str(e), 'traceback': traceback.format_exc()}, status=500)


@api_view(['GET'])
def get_personal_stats(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    
    # Get team-specific timings (aggregate from all teams)
    teams = employee.teams.all()
    if teams.exists():
        # For shift timings, we'll use the first team as the primary reference
        primary_team = teams.first()
        team_shift_start = primary_team.shift_start or '09:30 AM'
        team_shift_end = primary_team.shift_end or '06:30 PM'
        # Collect all unique members from all teams the employee is in
        team_members = Employees.objects.filter(teams__in=teams).distinct()
    else:
        team_shift_start = '09:30 AM'
        team_shift_end = '06:30 PM'
        team_members = Employees.objects.none()

    def get_start_dates(d):
        # Week starts Monday
        week_start = d - timedelta(days=d.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        # Month starts 1st
        month_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return week_start, month_start

    this_week_start, this_month_start = get_start_dates(now)
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = this_week_start - timedelta(seconds=1)

    def is_on_time(check_in, cutoff_str):
        if not check_in or check_in == '-': return False
        try:
            # Handle formats like "09:15 AM"
            t = datetime.strptime(str(check_in), '%I:%M %p').time()
            cutoff = datetime.strptime(cutoff_str, '%I:%M %p').time()
            return t <= cutoff
        except:
            return False

    def calc_stats_for_range(emp_list, start_dt, end_dt=None, cutoff_str='09:30 AM'):
        if end_dt is None: end_dt = now
            
        summaries = Attendance.objects.filter(
            employee__in=emp_list,
            date__gte=start_dt.strftime('%Y-%m-%d'),
            date__lte=end_dt.strftime('%Y-%m-%d')
        ).select_related('employee')
        
        today_str = now.strftime('%Y-%m-%d')
        
        # Pre-fetch logs for "today" if today is in range
        today_logs_map = {}
        if start_dt.strftime('%Y-%m-%d') <= today_str <= end_dt.strftime('%Y-%m-%d'):
            today_logs = AttendanceLogs.objects.filter(
                employee__in=emp_list,
                date=today_str
            ).order_by('employee', 'timestamp')
            
            for log in today_logs:
                emp_id = log.employee.employee_id # to_field is employee_id
                if emp_id not in today_logs_map:
                    today_logs_map[emp_id] = []
                today_logs_map[emp_id].append(log)

        total_mins = 0
        present_days = 0
        on_time_count = 0
        
        for s in summaries:
            mins = 0
            is_today = (s.date == today_str)
            
            if is_today:
                # Use pre-fetched logs
                logs = today_logs_map.get(s.employee.employee_id, [])
                calculated_mins = 0
                last_in = None
                
                for log in logs:
                    if log.type == 'IN':
                        last_in = log.timestamp
                    elif log.type == 'OUT' and last_in:
                        duration = (log.timestamp - last_in).total_seconds() / 60
                        calculated_mins += duration
                        last_in = None
                
                if last_in:
                    duration = (now - last_in).total_seconds() / 60
                    calculated_mins += duration
                    
                mins = int(calculated_mins)
            else:
                raw_worked = s.worked_hours
                if raw_worked and 'h' in raw_worked:
                    try:
                        # Optimization: Avoid replace/split if possible, use simple search or cache-friendly parsing
                        # But for now, just making it more robust
                        h_index = raw_worked.find('h')
                        h = int(raw_worked[:h_index])
                        m_str = raw_worked[h_index+1:].strip().replace('m', '')
                        m = int(m_str) if m_str else 0
                        mins = h * 60 + m
                    except: 
                        mins = 0
                else:
                    mins = 0
            
            if mins > 0 or (s.check_in and s.check_in != '-'):
                total_mins += mins
                present_days += 1
                if is_on_time(s.check_in, cutoff_str):
                    on_time_count += 1
                    
        avg_mins = int(total_mins / present_days) if present_days > 0 else 0
        on_time_pct = int((on_time_count / present_days) * 100) if present_days > 0 else 0
        
        h = int(avg_mins // 60)
        m = int(avg_mins % 60)
        return {
            "avg": f"{h}h {str(m).zfill(2)}m",
            "avg_mins": avg_mins,
            "onTime": f"{on_time_pct}%"
        }

    # "Me" Stats - use personal team timing
    me_week = calc_stats_for_range([employee], this_week_start, cutoff_str=team_shift_start)
    me_month = calc_stats_for_range([employee], this_month_start, cutoff_str=team_shift_start)
    me_last_week = calc_stats_for_range([employee], last_week_start, last_week_end, cutoff_str=team_shift_start)
    
    # Calculate difference vs last week
    diff_mins = me_week["avg_mins"] - me_last_week["avg_mins"]
    prefix = "+" if diff_mins >= 0 else "-"
    abs_mins = abs(diff_mins)
    diff_h = abs_mins // 60
    diff_m = abs_mins % 60
    last_week_diff = f"{prefix}{diff_h}h {str(diff_m).zfill(2)}m"

    # "Team" Stats
    if teams.exists():
        # For team stats, use the team's own shift_start
        team_week = calc_stats_for_range(team_members, this_week_start, cutoff_str=team_shift_start)
        team_month = calc_stats_for_range(team_members, this_month_start, cutoff_str=team_shift_start)
    else:
        team_week = {"avg": "0h 00m", "onTime": "0%"}
        team_month = {"avg": "0h 00m", "onTime": "0%"}

    return Response({
        'avg_working_hours': me_week["avg"], # Legacy support
        'lastWeekDiff': last_week_diff,
        'shift_start': team_shift_start,
        'shift_end': team_shift_end,
        'week': {
            'me': me_week,
            'team': team_week
        },
        'month': {
            'me': me_month,
            'team': team_month
        }
    })

@api_view(['GET'])
def get_history(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    # 1. Fetch Attendance Logs (last 60 days to be safe)
    start_date = (datetime.utcnow() - timedelta(days=60)).strftime('%Y-%m-%d')
    att_logs = Attendance.objects.filter(employee=employee, date__gte=start_date).order_by('-date')
    
    # Map by date string
    logs_map = {log.date: log for log in att_logs}

    # 2. Fetch Approved Leaves in potential range
    # Since leaves can be in the future, we just fetch recent/current leaves
    # We'll filter visually on frontend, but here we just need to enhance the data we return
    leaves = Leaves.objects.filter(
        employee=employee, 
        status__iexact='Approved',
        # Simple optimization: leaves that end after start_date
        to_date__gte=start_date
    )

    leave_dates = {}
    for leave in leaves:
        # Expand dates
        try:
            current_d = datetime.strptime(leave.from_date, '%Y-%m-%d')
            end_d = datetime.strptime(leave.to_date, '%Y-%m-%d')
            while current_d <= end_d:
                d_str = current_d.strftime('%Y-%m-%d')
                display_type = leave.type
                
                # Determine session for this specific day in the range
                day_session = 'Full Day'
                if d_str == leave.from_date:
                    day_session = leave.from_session
                elif d_str == leave.to_date:
                    day_session = leave.to_session
                
                if day_session == 'Session 1':
                    display_type = f"First Half {leave.type}"
                elif day_session == 'Session 2':
                    display_type = f"Second Half {leave.type}"
                
                leave_dates[d_str] = display_type
                current_d += timedelta(days=1)
        except ValueError:
            continue

    # Fetch Holidays in range
    holidays_qs = Holidays.objects.filter(date__gte=start_date)
    holiday_map = {h.date: h for h in holidays_qs}

    # 3. Build Result List (Backend usually returns 30 days based on existing logic, 
    # but now we need to make sure we return dates that have EITHER attendance OR leave OR holiday)
    
    # To keep it consistent with previous "return logs" behavior which relies on existing Attendance rows:
    # We will iterate over the UNION of keys from logs_map, leave_dates, and holiday_map, sorted.
    
    all_dates = set(logs_map.keys()) | set(leave_dates.keys()) | set(holiday_map.keys())
    sorted_dates = sorted(list(all_dates), reverse=True)[:35] # Return ~35 days to cover the request

    result = []
    for d_str in sorted_dates:
        log = logs_map.get(d_str)
        leave_type = leave_dates.get(d_str)
        holiday_info = holiday_map.get(d_str)
        is_holiday_combined = (log and log.is_holiday) or (holiday_info is not None)
        is_optional_holiday = holiday_info.is_optional if holiday_info else False
        holiday_name = holiday_info.name if holiday_info else None

        if log:
            # logs_map already has logs, but we need the detailed punches from AttendanceLogs
            pass

    # Pre-fetch all punches for the dates we are interested in
    all_punches = AttendanceLogs.objects.filter(
        employee=employee,
        date__in=sorted_dates
    ).order_by('timestamp')
    
    punches_by_date = {}
    for p in all_punches:
        if p.date not in punches_by_date:
            punches_by_date[p.date] = []
        punches_by_date[p.date].append(p)

    result = []
    for d_str in sorted_dates:
        log = logs_map.get(d_str)
        leave_type = leave_dates.get(d_str)
        holiday_info = holiday_map.get(d_str)
        is_holiday_combined = (log and log.is_holiday) or (holiday_info is not None)
        is_optional_holiday = holiday_info.is_optional if holiday_info else False
        holiday_name = holiday_info.name if holiday_info else None

        if log:
            punches = punches_by_date.get(log.date, [])
            logs_data = []
            calculated_break_mins = 0
            last_out_timestamp = None
            current_pair = {}
            
            for punch in punches:
                t_str = punch.timestamp.strftime('%I:%M %p')
                if punch.type == 'IN':
                    if current_pair and current_pair.get('in'):
                        current_pair['out'] = None
                        logs_data.append(current_pair)
                    
                    if last_out_timestamp:
                        break_dur = (punch.timestamp - last_out_timestamp).total_seconds() / 60
                        calculated_break_mins += int(round(break_dur))
                    current_pair = {'in': t_str}
                elif punch.type == 'OUT':
                    if not current_pair:
                        current_pair = {'in': None, 'out': t_str}
                        logs_data.append(current_pair)
                        last_out_timestamp = punch.timestamp
                        current_pair = {}
                    else:
                        current_pair['out'] = t_str
                        logs_data.append(current_pair)
                        last_out_timestamp = punch.timestamp
                        current_pair = {}
            
            if current_pair:
                 current_pair['out'] = None
                 logs_data.append(current_pair)

            india_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
            today_str = india_now.strftime('%Y-%m-%d')
            is_active = (log.date == today_str) and (not log.check_out or log.check_out == '-')
            display_status = leave_type if leave_type else log.status
            
            result.append({
                'date': log.date,
                'status': display_status,
                'leaveType': leave_type, 
                'checkIn': log.check_in or '-',
                'checkOut': log.check_out or '-',
                'is_active': is_active,
                'breakMinutes': calculated_break_mins if punches else (log.break_minutes or 0),
                'isHoliday': is_holiday_combined,
                'isOptionalHoliday': is_optional_holiday,
                'holidayName': holiday_name,
                'isWeekend': log.is_weekend,
                'logs': logs_data
            })
        else:
            # No Attendance Record, but IS a Leave Date
            # Synthesize an entry
            # Check if it's a weekend according to simple logic (optional, but good for UI)
            try:
                dt = datetime.strptime(d_str, '%Y-%m-%d')
                is_weekend = dt.weekday() >= 5
            except:
                is_weekend = False

            result.append({
                'date': d_str,
                'status': leave_type,
                'leaveType': leave_type,
                'checkIn': '-',
                'checkOut': '-',
                'breakMinutes': 0,
                'breakMinutes': 0,
                'isHoliday': is_holiday_combined,
                'isOptionalHoliday': is_optional_holiday,
                'holidayName': holiday_name,
                'isWeekend': is_weekend,
                'logs': []
            })
        
    return Response(result)
@api_view(['POST'])
def submit_regularization(request):
    data = request.data
    employee_id = data.get('employee_id')
    date = data.get('date')
    requested_checkout = data.get('check_out_time')
    reason = data.get('reason')

    if not all([employee_id, date, requested_checkout, reason]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
        
    if not employee:
        return Response({'error': 'Employee not found'}, status=404)

    attendance = Attendance.objects.filter(employee=employee, date=date).first()
    if not attendance:
        return Response({'error': 'Attendance record for this date not found'}, status=404)

    # Prevent duplicate pending requests for the same day
    existing = Regularization.objects.filter(attendance=attendance, status='Pending').exists()
    if existing:
        return Response({'error': 'A pending regularization request already exists for this date'}, status=400)

    reg = Regularization.objects.create(
        employee=employee,
        attendance=attendance,
        requested_checkout=requested_checkout,
        reason=reason
    )

    # Send Email to Team Manager(s)
    try:
        subject = f"Regularization Request - {employee.first_name} {employee.last_name} ({employee.employee_id})"
        title = "New Regularization Request"
        message = f"{employee.first_name} {employee.last_name} has requested attendance regularization for {date}.<br>Reason: {reason}<br>Requested Checkout: {requested_checkout}"
        
        managers = []
        for team in employee.teams.all():
            if team.manager and team.manager.email:
                managers.append(team.manager.email)
        
        for manager_email in set(managers):
            t = threading.Thread(target=process_regularization_email, args=(manager_email, subject, title, message))
            t.start()
            
    except Exception as e:
        print(f"Error initiating regularization email: {e}")

    return Response({'message': 'Regularization request submitted successfully'})

from django.db.models import Q, F, Exists, OuterRef

@api_view(['GET'])
def get_regularization_requests(request, manager_id):
    role = request.GET.get('role', 'manager')
    
    if role == 'employee':
        # Fetch requests where the user is the requester
        requests = Regularization.objects.filter(
            employee__employee_id=manager_id
        ).select_related('employee', 'attendance').order_by('-created_at')
    else:
        # Manager role: Fetch requests from team members or orphaned requests for admins
        manager = Employees.objects.filter(employee_id=manager_id).first()
        if not manager and str(manager_id).isdigit():
            manager = Employees.objects.filter(pk=manager_id).first()
        
        # More inclusive admin check (matches frontend logic)
        admin_roles = ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations']
        is_admin = (manager_id == 'MW-ADMIN') or \
                   (manager and (getattr(manager, 'is_admin', False) or manager.role in admin_roles))
        
        if is_admin:
            # Detect "orphaned" requests: those where the requester has no manager OTHER than themselves.
            # This correctly catches TLs who don't have another TL above them.
            
            # Subquery to check for external managers
            external_manager_exists = Teams.objects.filter(
                members__employee_id=OuterRef('employee__employee_id'),
                manager__isnull=False
            ).exclude(
                manager__employee_id=OuterRef('employee__employee_id')
            )
            
            requests_qs = Regularization.objects.annotate(
                has_external_manager=Exists(external_manager_exists)
            )
            
            # An "orphan" request is one where has_external_manager is False
            orphans_q = Q(has_external_manager=False)
            
            if manager:
                # For a specific Admin user:
                # 1. Requests from teams they directly manage
                # 2. PLUS all "orphaned" requests in the system.
                teams = Teams.objects.filter(manager=manager)
                requests = requests_qs.filter(
                    orphans_q | Q(employee__teams__in=teams)
                ).select_related('employee', 'attendance').distinct().order_by('-created_at')
            else:
                # Hardcoded MW-ADMIN or logic where manager object isn't found
                requests = requests_qs.filter(orphans_q).select_related('employee', 'attendance').order_by('-created_at')
        else:
            if not manager:
                return Response({'error': 'Manager not found'}, status=404)
                
            teams = Teams.objects.filter(manager=manager)
            requests = Regularization.objects.filter(
                employee__teams__in=teams
            ).select_related('employee', 'attendance').distinct().order_by('-created_at')
    
    data = []
    for r in requests:
        data.append({
            'id': r.id,
            'employee_name': f"{r.employee.first_name} {r.employee.last_name}",
            'employee_id': r.employee.employee_id,
            'date': r.attendance.date,
            'check_in': r.attendance.check_in,
            'requested_checkout': r.requested_checkout,
            'reason': r.reason,
            'status': r.status,
            'created_at': r.created_at.isoformat(),
            'attendance': {
                'date': r.attendance.date,
                'check_in': r.attendance.check_in,
                'check_out': r.attendance.check_out
            }
        })
    
    return Response(data)

@api_view(['POST'])
def action_regularization(request, pk):
    action = request.data.get('action') # 'Approved' or 'Rejected'
    if action not in ['Approved', 'Rejected']:
        return Response({'error': 'Invalid action'}, status=400)

    try:
        reg = Regularization.objects.get(pk=pk)
    except Regularization.DoesNotExist:
        return Response({'error': 'Request not found'}, status=404)

    reg.status = action
    reg.save()

    if action == 'Approved':
        # Update the actual attendance record
        att = reg.attendance
        att.check_out = reg.requested_checkout
        
        # Recalculate working hours if check_in exists
        if att.check_in and att.check_in != '-':
            try:
                # Naive calculation based on string times assuming same day
                fmt = '%I:%M %p'
                in_time = datetime.strptime(att.check_in, fmt)
                out_time = datetime.strptime(att.check_out, fmt)
                
                total_mins = (out_time - in_time).total_seconds() / 60
                if total_mins < 0: # Handle cross-day if necessary, but here we assume same day
                    total_mins += 1440
                
                break_mins = att.break_minutes or 0
                effective_mins = max(0, total_mins - break_mins)
                
                h = int(effective_mins // 60)
                m = int(effective_mins % 60)
                att.worked_hours = f"{h}h {m}m"
            except Exception as e:
                print(f"Error calculating hours: {e}")
        
        att.status = 'Present'
        att.status = 'Present'
        att.save()

    # Send Email to Employee
    try:
        subject = f"Regularization Request {action}"
        title = f"Request {action}"
        color = "#166534" if action == 'Approved' else "#b91c1c"
        icon = "✅" if action == 'Approved' else "❌"
        message = f"Your regularization request for {reg.attendance.date} has been {action}."
        
        if reg.employee.email:
             t = threading.Thread(target=process_regularization_email, args=(reg.employee.email, subject, title, message, color, icon))
             t.start()
    except Exception as e:
        print(f"Error initiating action email: {e}")

    return Response({'message': f'Request {action.lower()} successfully'})

@api_view(['GET'])
def get_holidays(request):
    cache_key = 'holidays_list'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)

    current_year = datetime.now().year
    # Fetch holidays from current date onwards
    # Fetch holidays for the entire current year (and maybe next year for buffer)
    start_date = f"{current_year}-01-01"
    holidays = Holidays.objects.filter(date__gte=start_date).order_by('date')
    
    data = []
    for h in holidays:
        # Pre-format date for frontend if needed, but let's send parts too
        # Frontend expects "Wed, 14 January, 2026"
        # Let's do formatting here to match the static data structure if possible, 
        # or stick to raw date and update frontend.
        # User said "display those in dashboard holidays card as a carousal like now".
        # Current code in HolidayCard: {holidays[holidayIndex].date}
        # It's better to format it here.
        
        try:
             dt = datetime.strptime(h.date, '%Y-%m-%d')
             formatted_date = dt.strftime('%a, %d %B, %Y')
        except:
             formatted_date = h.date

        data.append({
            'date': formatted_date, 
            'raw_date': h.date,
            'name': h.name,
            'type': h.type,
            'is_optional': h.is_optional
        })
    
    cache.set(cache_key, data, 3600) # Cache for 1 hour
    return Response(data)
