import requests
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Attendance, AttendanceLogs, Leaves, Regularization, Teams, Holidays
from datetime import datetime, timedelta
from django.db.models import Q
import pytz


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
            parts = [
                addr.get('office') or addr.get('amenity') or addr.get('building') or addr.get('shop') or addr.get('industrial'),
                addr.get('neighbourhood') or addr.get('suburb') or addr.get('road'),
                addr.get('city') or addr.get('town') or addr.get('village')
            ]
            parts = [p for p in parts if p]
            
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
    
    if not employee_id:
        return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Try lookup by employee_id first (the new standard)
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            # Fallback to internal ID for active sessions that haven't refreshed
            employee = Employees.objects.filter(pk=employee_id).first()
            
        if not employee:
            return Response({'error': f'Employee with ID {employee_id} not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # India Time Adjustment (naive)
    india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_date_str = india_time.strftime('%Y-%m-%d')
    current_time_str = india_time.strftime('%I:%M %p')
    print(f"DEBUG: India Time Calculated: {india_time}")

    # Removed: Check for approved leave restriction
    # is_on_leave = Leaves.objects.filter(
    #     employee=employee,
    #     status='Approved',
    #     from_date__lte=current_date_str,
    #     to_date__gte=current_date_str
    # ).exists()
    # 
    # if is_on_leave:
    #     return Response({'error': 'Cannot clock in/out while on approved leave.'}, status=status.HTTP_400_BAD_REQUEST)

    last_log_today = AttendanceLogs.objects.filter(employee_id=employee_id, date=current_date_str).order_by('-timestamp').first()
    
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
        if attendance_summary.check_in and attendance_summary.check_in != '-':
            attendance_summary.check_out = current_time_str
        
        if attendance_summary.check_in:
            first_log = AttendanceLogs.objects.filter(employee=employee, date=current_date_str, type='IN').order_by('timestamp').first()
            if first_log:
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
        
        # Check for approved leave
        is_on_leave = Leaves.objects.filter(
            employee=employee,
            status='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).exists()

        is_weekend = now.weekday() >= 5  # 5=Saturday, 6=Sunday
        
        # Always allow clocking, even on leave/weekend/holiday
        can_clock = True 
        disabled_reason = None
        
        if is_holiday:
            disabled_reason = 'Holiday'
        elif is_on_leave:
            disabled_reason = 'On Leave'
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
                can_clock = True  # Still allow clocking in even if marked absent

        last_log = AttendanceLogs.objects.filter(employee=employee).order_by('-timestamp').first()
        summary = Attendance.objects.filter(employee=employee, date=current_date_str).first()
        
        att_status = 'OUT'
        # Prioritize summary (Attendance model) as it includes regularized/manual updates
        if summary:
            if summary.check_in and summary.check_in != '-' and (not summary.check_out or summary.check_out == '-'):
                att_status = 'IN'
        # Fallback to logs if summary doesn't exist yet (though clock-in should create it)
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
        )
        
        total_mins = 0
        present_days = 0
        on_time_count = 0
        
        for s in summaries:
            mins = 0
            is_today = (s.date == now.strftime('%Y-%m-%d'))
            
            if is_today:
                # Calculate from logs for accuracy (Live status)
                logs = AttendanceLogs.objects.filter(employee=s.employee, date=s.date).order_by('timestamp')
                calculated_mins = 0
                last_in = None
                
                for log in logs:
                    if log.type == 'IN':
                        last_in = log.timestamp
                    elif log.type == 'OUT' and last_in:
                        duration = (log.timestamp - last_in).total_seconds() / 60
                        calculated_mins += duration
                        last_in = None
                
                # Add live duration if currently IN
                if last_in:
                    duration = (now - last_in).total_seconds() / 60
                    calculated_mins += duration
                    
                # Subtract breaks if tracked in summary (optional, but logs calculation implicitly handles breaks between logs)
                # If we just sum durations between IN and OUT, we handle breaks correctly (unlogged time is break).
                # But we should respect 'break_minutes' if they are manually added? 
                # Usually logs are the source of truth.
                mins = int(calculated_mins)
            else:
                # Past days: Use stored worked_hours
                if s.worked_hours and 'h' in s.worked_hours:
                    try:
                        parts = s.worked_hours.replace('m', '').split('h ')
                        h = int(parts[0])
                        m = int(parts[1]) if len(parts) > 1 else 0
                        mins = h * 60 + m
                    except: pass
            
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
        status='Approved',
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
            # Existing Attendance Record
            punches = AttendanceLogs.objects.filter(employee=employee, date=log.date).order_by('timestamp')
            logs_data = []
            calculated_break_mins = 0
            last_out_timestamp = None
            current_pair = {}
            
            for punch in punches:
                t_str = punch.timestamp.strftime('%I:%M %p')
                if punch.type == 'IN':
                    if current_pair and current_pair.get('in'):
                        # Previous was an IN without OUT
                        current_pair['out'] = None
                        logs_data.append(current_pair)
                    
                    if last_out_timestamp:
                        break_dur = (punch.timestamp - last_out_timestamp).total_seconds() / 60
                        calculated_break_mins += int(round(break_dur))
                    current_pair = {'in': t_str}
                elif punch.type == 'OUT':
                    if not current_pair:
                        # OUT without IN (Missed Check-in)
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
            is_active = (log.date == today_str) and (punches.last().type == 'IN' if punches.exists() else False)

            # Override status if leave exists for this date
            display_status = leave_type if leave_type else log.status
            
            result.append({
                'date': log.date,
                'status': display_status,
                'leaveType': leave_type, 
                'checkIn': log.check_in or '-',
                # If active, check_out must be '-' to trigger 'Active'/'Missed' status on frontend
                'checkOut': '-' if is_active else (log.check_out or '-'),
                'breakMinutes': calculated_break_mins if punches.exists() else (log.break_minutes or 0),
                'breakMinutes': calculated_break_mins if punches.exists() else (log.break_minutes or 0),
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

    Regularization.objects.create(
        employee=employee,
        attendance=attendance,
        requested_checkout=requested_checkout,
        reason=reason
    )

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
        att.save()

    return Response({'message': f'Request {action.lower()} successfully'})

@api_view(['GET'])
def get_holidays(request):
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
    return Response(data)
