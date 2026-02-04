from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Attendance, AttendanceLogs, Leaves, Regularization, Teams
from datetime import datetime, timedelta
from django.db.models import Q
import pytz


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
        attendance_record = Attendance.objects.filter(
            employee=employee,
            date=current_date_str
        ).first()
        
        is_holiday = attendance_record and attendance_record.is_holiday
        
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

    def is_on_time(check_in):
        if not check_in or check_in == '-': return False
        try:
            # Handle formats like "09:15 AM"
            t = datetime.strptime(str(check_in), '%I:%M %p').time()
            cutoff = datetime.strptime('09:30 AM', '%I:%M %p').time()
            return t <= cutoff
        except:
            return False

    def calc_stats_for_range(emp_list, start_dt, end_dt=None):
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
                if is_on_time(s.check_in):
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

    # "Me" Stats
    me_week = calc_stats_for_range([employee], this_week_start)
    me_month = calc_stats_for_range([employee], this_month_start)
    me_last_week = calc_stats_for_range([employee], last_week_start, last_week_end)
    
    # Calculate difference vs last week
    diff_mins = me_week["avg_mins"] - me_last_week["avg_mins"]
    prefix = "+" if diff_mins >= 0 else "-"
    abs_mins = abs(diff_mins)
    diff_h = abs_mins // 60
    diff_m = abs_mins % 60
    last_week_diff = f"{prefix}{diff_h}h {str(diff_m).zfill(2)}m"

    # "Team" Stats
    team_week = {"avg": "0h 00m", "onTime": "0%"}
    team_month = {"avg": "0h 00m", "onTime": "0%"}
    
    if employee.team:
        team_members = Employees.objects.filter(team=employee.team)
        team_week = calc_stats_for_range(team_members, this_week_start)
        team_month = calc_stats_for_range(team_members, this_month_start)

    return Response({
        'avg_working_hours': me_week["avg"], # Legacy support
        'lastWeekDiff': last_week_diff,
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

    # 3. Build Result List (Backend usually returns 30 days based on existing logic, 
    # but now we need to make sure we return dates that have EITHER attendance OR leave)
    
    # To keep it consistent with previous "return logs" behavior which relies on existing Attendance rows:
    # We will iterate over the UNION of keys from logs_map and leave_dates, sorted.
    
    all_dates = set(logs_map.keys()) | set(leave_dates.keys())
    sorted_dates = sorted(list(all_dates), reverse=True)[:35] # Return ~35 days to cover the request

    result = []
    for d_str in sorted_dates:
        log = logs_map.get(d_str)
        leave_type = leave_dates.get(d_str)

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
                    if last_out_timestamp:
                        break_dur = (punch.timestamp - last_out_timestamp).total_seconds() / 60
                        calculated_break_mins += int(round(break_dur))
                    current_pair = {'in': t_str}
                elif punch.type == 'OUT' and 'in' in current_pair:
                    current_pair['out'] = t_str
                    logs_data.append(current_pair)
                    last_out_timestamp = punch.timestamp
                    current_pair = {}
            
            if 'in' in current_pair:
                 current_pair['out'] = None
                 logs_data.append(current_pair)

            is_active = punches.last().type == 'IN' if punches.exists() else False

            # Override status if leave exists for this date
            display_status = leave_type if leave_type else log.status
            
            result.append({
                'date': log.date,
                'status': display_status,
                'leaveType': leave_type, # Provide explicit field
                'checkIn': log.check_in or '-',
                'checkOut': log.check_out if (log.check_out and log.check_out != '-') else ('-' if is_active else '-'),
                'breakMinutes': calculated_break_mins if punches.exists() else (log.break_minutes or 0),
                'isHoliday': log.is_holiday,
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
                'isHoliday': False, # Could check holidays table if we had access to it easily here, but safe default
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

@api_view(['GET'])
def get_regularization_requests(request, manager_id):
    manager = Employees.objects.filter(employee_id=manager_id).first()
    if not manager and str(manager_id).isdigit():
        manager = Employees.objects.filter(pk=manager_id).first()
    
    if not manager:
        return Response({'error': 'Manager not found'}, status=404)
        
    teams = Teams.objects.filter(manager=manager)
    requests = Regularization.objects.filter(
        employee__team__in=teams,
        status='Pending'
    ).select_related('employee', 'attendance').order_by('-created_at')
    
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
            'created_at': r.created_at.isoformat()
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
