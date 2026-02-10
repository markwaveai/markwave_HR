import random
import traceback
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Teams, Employees, Attendance, Leaves
from .serializers import TeamsSerializer, EmployeesSerializer
from datetime import datetime, timedelta

def is_user_admin(employee):
    """Checks if an employee has administrative privileges."""
    if not employee:
        return False
    admin_roles = ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations']
    return (
        employee.role in admin_roles or 
        getattr(employee, 'is_admin', False) or 
        employee.first_name == 'Admin'
    )

@api_view(['GET', 'POST'])
def team_list(request):
    if request.method == 'GET':
        teams = Teams.objects.all()
        serializer = TeamsSerializer(teams, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data
        manager_id = data.get('manager_id')
        manager = None
        if manager_id:
            try:
                manager = Employees.objects.filter(employee_id=manager_id).first()
                if not manager and str(manager_id).isdigit():
                    manager = Employees.objects.filter(pk=manager_id).first()
                
                if not manager and manager_id:
                    return Response({'error': f'Manager with ID {manager_id} not found'}, status=status.HTTP_404_NOT_FOUND)
            except Exception:
                pass

        try:
            team = Teams.objects.create(
                name=data.get('name'),
                description=data.get('description'),
                manager=manager
            )
            return Response({'message': 'Team created successfully', 'id': team.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
def team_detail(request, pk):
    try:
        team = Teams.objects.get(pk=pk)
    except Teams.DoesNotExist:
        return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        data = request.data
        try:
            if 'name' in data: team.name = data['name']
            if 'description' in data: team.description = data['description']
            if 'manager_id' in data:
                manager_id = data['manager_id']
                manager = Employees.objects.filter(employee_id=manager_id).first()
                if not manager and str(manager_id).isdigit():
                    manager = Employees.objects.filter(pk=manager_id).first()
                
                if manager:
                    team.manager = manager
                elif manager_id:
                     return Response({'error': f"Manager with ID {manager_id} not found"}, status=status.HTTP_404_NOT_FOUND)
            team.save()
            return Response({'message': 'Team updated successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            # For M2M, removing team just means removing the association
            # But here we are deleting the TEAM itself.
            # When deleting a team, just remove it from all employees
            team.members.clear()
            team.delete()
            return Response({'message': 'Team deleted successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def member_list(request):
    if request.method == 'GET':
        team_id = request.query_params.get('team_id')
        query = Employees.objects.filter(status__in=['Active', 'Remote'])
        if team_id:
            query = query.filter(teams__id=team_id)
        
        members = list(query)
        if not team_id and len(members) > 6:
            members = random.sample(members, 6)
            
        india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
        current_date_str = india_time.strftime('%Y-%m-%d')
        
        # Get approved leaves for today for these members
        member_ids = [m.employee_id for m in members]
        on_leave_ids = set(Leaves.objects.filter(
            employee_id__in=member_ids,
            status='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).values_list('employee_id', flat=True))
            
        return Response([{
            'id': m.id,
            'employee_id': m.employee_id,
            'name': f"{m.first_name} {m.last_name}",
            'role': m.role,
            'status': 'On Leave' if m.employee_id in on_leave_ids else (m.status or 'Active'),
            'location': m.location,
            'email': m.email
        } for m in members])

    elif request.method == 'POST':
        # Permission check: Only Team Leader of the target team or Admin can add
        acting_user_id = request.data.get('acting_user_id')
        team_id = request.data.get('team_id')
        
        if acting_user_id:
            try:
                if str(acting_user_id).isdigit():
                    acting_emp = Employees.objects.get(id=acting_user_id)
                else:
                    acting_emp = Employees.objects.get(employee_id=acting_user_id)
                
                # Check if authorized
                is_authorized = Teams.objects.filter(id=team_id, manager=acting_emp).exists()
                if not is_authorized and is_user_admin(acting_emp):
                    is_authorized = True
                    
                if not is_authorized:
                    return Response({'error': 'Unauthorized. Only the Team Leader or an Admin can add members.'}, status=403)
            except Employees.DoesNotExist:
                return Response({'error': 'Acting user not found'}, status=403)
            except Exception as e:
                print(f"Permission check error: {e}")

        data = request.data
        try:
            # 1. Mandatory Fields Check
            required_fields = ['first_name', 'email', 'employee_id', 'contact', 'aadhar', 'location', 'role']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f"Field '{field}' is required."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Duplicate Checks
            if Employees.objects.filter(employee_id=data.get('employee_id')).exists():
                return Response({'error': f"Employee ID '{data.get('employee_id')}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            if Employees.objects.filter(email=data.get('email')).exists():
                return Response({'error': f"Email '{data.get('email')}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            if Employees.objects.filter(contact=data.get('contact')).exists():
                return Response({'error': f"Contact number '{data.get('contact')}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

            if Employees.objects.filter(aadhar=data.get('aadhar')).exists():
                return Response({'error': f"Aadhar number '{data.get('aadhar')}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            first_name = data.get('first_name')
            last_name = data.get('last_name', '')

            # Get Team
            team_id = data.get('team_id')
            team = None
            if team_id:
                try:
                    team = Teams.objects.get(id=team_id)
                except Teams.DoesNotExist:
                    pass

            employee = Employees.objects.create(
                employee_id=data.get('employee_id'),
                first_name=first_name,
                last_name=last_name,
                role=data.get('role'),
                status='Active',
                location=data.get('location'),
                email=data.get('email'),
                contact=data.get('contact'),
                aadhar=data.get('aadhar')
            )
            if team:
                employee.teams.add(team)
            return Response({'message': 'Employee added successfully', 'id': employee.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def registry_list(request):
    members = Employees.objects.filter(status__in=['Active', 'Remote']).order_by('id')
    serializer = EmployeesSerializer(members, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def designation_list(request):
    """Returns a unique list of designations for dropdowns."""
    designations = Employees.objects.exclude(role__isnull=True).exclude(role='').values_list('role', flat=True).distinct().order_by('role')
    return Response([{'name': d} for d in designations])

@api_view(['PUT', 'DELETE'])
def member_detail(request, pk):
    try:
        employee = Employees.objects.get(pk=pk)
    except Employees.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        # Permission check: Only manager of the team or Admin can add/update
        acting_user_id = request.data.get('acting_user_id')
        new_team_id = request.data.get('team_id')
        
        if acting_user_id:
            try:
                # Get the person doing the action
                if str(acting_user_id).isdigit():
                    acting_emp = Employees.objects.get(id=acting_user_id)
                else:
                    acting_emp = Employees.objects.get(employee_id=acting_user_id)
                
                # Revised Permission Logic
                is_authorized = False
                
                # 1. Broad Admin Check (consistent across app)
                if is_user_admin(acting_emp):
                    is_authorized = True
                
                if not is_authorized:
                    # 2. Check if they are the manager of ANY of member's CURRENT teams
                    # In M2M, employee.teams is a queryset
                    if employee.teams.filter(manager=acting_emp).exists():
                        is_authorized = True
                    
                    # 3. Check if they are the manager of the member's NEW target team
                    if not is_authorized and new_team_id:
                        if Teams.objects.filter(id=new_team_id, manager=acting_emp).exists():
                            is_authorized = True
                    
                if not is_authorized:
                    return Response({'error': 'Unauthorized. Only the Team Leader or an Admin can manage members.'}, status=403)
            except Employees.DoesNotExist:
                return Response({'error': 'Acting user not found'}, status=403)
            except Exception as e:
                print(f"Permission check error: {e}")
                pass # Continue if check fails for other reasons for now to avoid blocking

        data = request.data
        try:
            # Update basic fields
            employee.first_name = data.get('first_name', employee.first_name)
            if 'employee_id' in data: employee.employee_id = data['employee_id']
            if 'last_name' in data: employee.last_name = data['last_name']
            if 'role' in data: employee.role = data['role']
            if 'contact' in data: employee.contact = data['contact']
            if 'email' in data: employee.email = data['email']
            if 'aadhar' in data: employee.aadhar = data['aadhar']
            if 'location' in data: employee.location = data['location']
            if 'status' in data: employee.status = data['status']
            
            # Update Team if provided
            # Update Team if provided
            if 'team_id' in data:
                new_team_id = data['team_id']
                if new_team_id:
                    try:
                        team_to_add = Teams.objects.get(id=new_team_id)
                        employee.teams.add(team_to_add)
                    except Teams.DoesNotExist:
                        return Response({'error': f'Team with ID {new_team_id} not found'}, status=404)
            
            # Handle removal if provided
            if 'remove_team_id' in data:
                remove_id = data['remove_team_id']
                if remove_id:
                    try:
                         team_to_remove = Teams.objects.get(id=remove_id)
                         employee.teams.remove(team_to_remove)
                    except Teams.DoesNotExist:
                        pass # Ignore if team doesn't exist

            employee.save()
            return Response({'message': 'Employee updated successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            employee.delete()
            return Response({'message': 'Employee deleted successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def team_stats(request):
    try:
        team_ids_str = request.query_params.get('team_id')
        
        # If no team_id is provided, return null stats (user doesn't belong to a team)
        if not team_ids_str:
            return Response({
                'total': 0,
                'active': 0,
                'onLeave': 0,
                'remote': 0,
                'avg_working_hours': None,
                'on_time_arrival': None
            })
        
        team_ids = [tid.strip() for tid in team_ids_str.split(',') if tid.strip()]
        
        query = Employees.objects.filter(status__in=['Active', 'Remote'])
        if team_ids:
            query = query.filter(teams__id__in=team_ids)
            
        members = query.all()
        
        total = len(members)
        now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        today_date = now.strftime('%Y-%m-%d')
        monday = now - timedelta(days=now.weekday())
        monday_str = monday.strftime('%Y-%m-%d')
        
        # Calculate On Leave from Leaves table
        on_leave_ids = Leaves.objects.filter(
            employee__employee_id__in=list(query.values_list('employee_id', flat=True)),
            status='Approved',
            from_date__lte=today_date,
            to_date__gte=today_date
        ).values_list('employee', flat=True).distinct()
        
        on_leave = on_leave_ids.count()
        
        # Active Now = Active Status AND NOT On Leave
        # on_leave_ids contains employee_id strings (because Leaves.employee points to to_field='employee_id')
        # So we must exclude based on employee_id, not id (which is int)
        active = query.filter(status='Active').exclude(employee_id__in=on_leave_ids).count()
        
        attendance_records = Attendance.objects.filter(
            employee__employee_id__in=list(query.values_list('employee_id', flat=True)),
            date__gte=monday_str
        )
        
        total_minutes = 0
        present_count = 0
        on_time_count = 0
        
        def parse_worked_hours(wh):
            if not wh or 'h' not in wh: return 0
            try:
                parts = wh.replace('m', '').split('h ')
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                return h * 60 + m
            except:
                return 0

        def is_on_time(check_in):
            if not check_in or ':' not in check_in: return False
            try:
                t = datetime.strptime(check_in, '%I:%M %p')
                cutoff = datetime.strptime('09:30 AM', '%I:%M %p')
                return t <= cutoff
            except:
                return False

        for rec in attendance_records:
            rec_mins = parse_worked_hours(rec.worked_hours)
            if not rec_mins and rec.check_in and rec.check_in != '-':
                try:
                    india_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
                    in_time = datetime.strptime(rec.check_in, '%I:%M %p')
                    in_time = in_time.replace(year=india_now.year, month=india_now.month, day=india_now.day)
                    if india_now > in_time:
                        rec_mins = int((india_now - in_time).total_seconds() / 60)
                except:
                    pass

            if rec_mins > 0:
                present_count += 1
                total_minutes += rec_mins
                if is_on_time(rec.check_in):
                    on_time_count += 1
                    
        avg_mins = total_minutes // present_count if present_count > 0 else 0
        avg_h = avg_mins // 60
        avg_m = avg_mins % 60
        
        avg_working_hours = f"{avg_h}h {avg_m}m"
        on_time_arrival = f"{int((on_time_count / present_count) * 100)}%" if present_count > 0 else "0%"
        remote = query.filter(status='Remote').count()

        return Response({
            'total': total,
            'active': active,
            'onLeave': on_leave,
            'remote': remote,
            'avg_working_hours': avg_working_hours,
            'on_time_arrival': on_time_arrival
        })
    except Exception as e:
        print(f"Error in team_stats: {str(e)}")
        traceback.print_exc()
        return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)

@api_view(['GET'])
def dashboard_stats(request):
    try:
        india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
        current_date_str = india_time.strftime('%Y-%m-%d')
        
        active_employees = Employees.objects.filter(status='Active')
        total_count = active_employees.count()
        
        # --- Absentees Logic ---
        present_employee_ids = list(Attendance.objects.filter(
            date=current_date_str,
            check_in__isnull=False
        ).exclude(check_in='-').values_list('employee', flat=True))
        
        # Filter out None to avoid SQL 'NOT IN (..., NULL)' which excludes everything in some DBs
        present_employee_ids = [pid for pid in present_employee_ids if pid is not None]
        
        absentees = active_employees.exclude(employee_id__in=present_employee_ids)
        absentees_count = absentees.count()
        
        on_leave_employee_ids = Leaves.objects.filter(
            employee__in=absentees,
            status='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).values_list('employee__employee_id', flat=True)
        
        on_leave_set = set(on_leave_employee_ids)

        absentees_list = []
        for emp in absentees:
            is_on_leave = emp.employee_id in on_leave_set
            absentees_list.append({
                'id': emp.id,
                'employee_id': emp.employee_id,
                'name': f"{emp.first_name} {emp.last_name}",
                'role': emp.role,
                'location': emp.location,
                'status': 'On Leave' if is_on_leave else 'Absent'
            })
            
        # --- Global Avg Hours Logic ---
        def get_week_range(d):
            start = d - timedelta(days=d.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=6)
            end = end.replace(hour=23, minute=59, second=59)
            return start, end

        this_mon, this_sun = get_week_range(india_time)
        last_mon = this_mon - timedelta(days=7)
        last_sun = this_sun - timedelta(days=7)
        
        # Helper to calc avg for a date range for ALL employees
        def calc_global_avg(start_dt, end_dt):
            # We use Attendance summaries for speed
            summaries = Attendance.objects.filter(
                date__gte=start_dt.strftime('%Y-%m-%d'),
                date__lte=end_dt.strftime('%Y-%m-%d')
            ).exclude(worked_hours__isnull=True).exclude(worked_hours='-')
            
            total_mins = 0
            count = 0
            
            for s in summaries:
                # Parse worked_hours string "8h 30m"
                if not s.worked_hours: continue
                try:
                    parts = s.worked_hours.replace('m', '').split('h ')
                    h = int(parts[0])
                    m = int(parts[1]) if len(parts) > 1 else 0
                    mins = h * 60 + m
                    if mins > 0:
                        total_mins += mins
                        count += 1
                except:
                    pass
            
            # Average per present-person-day
            return total_mins / count if count > 0 else 0

        avg_this = calc_global_avg(this_mon, this_sun)
        avg_last = calc_global_avg(last_mon, last_sun)
        
        # Format "This Week"
        h = int(avg_this // 60)
        m = int(avg_this % 60)
        avg_working_hours = f"{h}h {str(m).zfill(2)}m"
        
        # Calc Diff
        diff = avg_this - avg_last
        diff_abs = abs(int(diff))
        diff_h = diff_abs // 60
        diff_m = diff_abs % 60
        prefix = "+" if diff >= 0 else "-"
        last_week_diff = f"{prefix}{diff_h}h {str(diff_m).zfill(2)}m"

        # --- Global On Time Arrival ---
        def is_on_time(check_in):
            if not check_in or ':' not in check_in: return False
            try:
                t = datetime.strptime(check_in, '%I:%M %p')
                cutoff = datetime.strptime('09:30 AM', '%I:%M %p')
                return t <= cutoff
            except:
                return False

        # Check records for THIS WEEK (this_mon to this_sun)
        week_records = Attendance.objects.filter(
             date__gte=this_mon.strftime('%Y-%m-%d'),
             date__lte=this_sun.strftime('%Y-%m-%d')
        ).exclude(check_in__isnull=True).exclude(check_in='-')

        present_count = week_records.count()
        on_time_count = 0
        for rec in week_records:
            if is_on_time(rec.check_in):
                on_time_count += 1
                
        on_time_arrival = f"{int((on_time_count / present_count) * 100)}%" if present_count > 0 else "0%"

        return Response({
            'total_employees': total_count,
            'absentees_count': absentees_count,
            'absentees': absentees_list,
            'avg_working_hours': avg_working_hours,
            'lastWeekDiff': last_week_diff,
            'on_time_arrival': on_time_arrival
        })
    except Exception as e:
        print(f"Error in dashboard_stats: {str(e)}")
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
