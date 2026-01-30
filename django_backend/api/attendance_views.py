from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Attendance, AttendanceLogs
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
    
    if clock_type == 'IN':
        if not attendance_summary.check_in:
             attendance_summary.check_in = current_time_str
        elif last_log_today and last_log_today.type == 'OUT':
            break_duration = (india_time - last_log_today.timestamp).total_seconds() / 60
            if attendance_summary.break_minutes is None:
                attendance_summary.break_minutes = 0
            attendance_summary.break_minutes += int(round(break_duration))

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
    # Lookup employee to handle both string employee_id and internal ID
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_date_str = now.strftime('%Y-%m-%d')
    
    last_log = AttendanceLogs.objects.filter(employee=employee).order_by('-timestamp').first()
    summary = Attendance.objects.filter(employee=employee, date=current_date_str).first()
    
    att_status = 'OUT'
    if last_log and last_log.type == 'IN' and last_log.date == current_date_str:
        att_status = 'IN'
        
    return Response({
        'status': att_status,
        'check_in': summary.check_in if summary else '-',
        'check_out': summary.check_out if summary else '-',
        'break_minutes': summary.break_minutes if summary else 0,
        'worked_hours': summary.worked_hours if summary else '-'
    })

@api_view(['GET'])
def get_personal_stats(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    current_date_str = now.strftime('%Y-%m-%d')

    def get_week_range(d):
        start = d - timedelta(days=d.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=6)
        end = end.replace(hour=23, minute=59, second=59)
        return start, end

    this_mon, this_sun = get_week_range(now)
    last_mon = this_mon - timedelta(days=7)
    last_sun = this_sun - timedelta(days=7)

    def calc_avg_for_range(start_dt, end_dt):
        summaries = Attendance.objects.filter(
            employee=employee,
            date__gte=start_dt.strftime('%Y-%m-%d'),
            date__lte=end_dt.strftime('%Y-%m-%d')
        )
        
        total_eff_mins = 0
        days_with_activity = 0
        
        for summary in summaries:
            punches = AttendanceLogs.objects.filter(employee=employee, date=summary.date).order_by('timestamp')
            if not punches: continue
                
            day_mins = 0
            current_in = None
            for p in punches:
                if p.type == 'IN':
                    current_in = p.timestamp
                elif p.type == 'OUT' and current_in:
                    day_mins += (p.timestamp - current_in).total_seconds() / 60
                    current_in = None
            
            if current_in and summary.date == current_date_str:
                day_mins += (now - current_in).total_seconds() / 60
                
            if day_mins > 0:
                total_eff_mins += day_mins
                days_with_activity += 1
                
        return total_eff_mins / days_with_activity if days_with_activity > 0 else 0

    avg_this = calc_avg_for_range(this_mon, this_sun)
    avg_last = calc_avg_for_range(last_mon, last_sun)
    diff = avg_this - avg_last

    def format_mins(m):
        h = int(m // 60)
        mins = int(m % 60)
        return f"{h}h {mins}m"

    diff_abs = abs(int(diff))
    diff_h = diff_abs // 60
    diff_m = diff_abs % 60
    diff_str = f"{diff_h}h {diff_m}m" if diff_abs >= 60 else f"{diff_m}m"

    return Response({
        'avg_working_hours': format_mins(avg_this),
        'this_week_mins': int(avg_this),
        'last_week_mins': int(avg_last),
        'diff_label': f"{'+' if diff >= 0 else '-'}{diff_str} vs last week" if diff_abs > 0 else "Same as last week",
        'diff_status': 'up' if diff >= 0 else 'down'
    })

@api_view(['GET'])
def get_history(request, employee_id):
    employee = Employees.objects.filter(employee_id=employee_id).first()
    if not employee and str(employee_id).isdigit():
        employee = Employees.objects.filter(pk=employee_id).first()
    
    if not employee:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    logs = Attendance.objects.filter(employee=employee).order_by('-date')[:30]
    result = []
    for log in logs:
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

        result.append({
            'date': log.date,
            'status': log.status,
            'checkIn': log.check_in or '-',
            'checkOut': '-' if is_active else (log.check_out or '-'),
            'breakMinutes': calculated_break_mins if punches.exists() else (log.break_minutes or 0),
            'isHoliday': log.is_holiday,
            'isWeekend': log.is_weekend,
            'logs': logs_data
        })
        
    return Response(result)
