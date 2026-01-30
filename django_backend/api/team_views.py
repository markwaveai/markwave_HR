import random
import traceback
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Teams, Employees, Attendance
from .serializers import TeamsSerializer, EmployeesSerializer
from datetime import datetime, timedelta

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
            Employees.objects.filter(team=team).update(team=None)
            team.delete()
            return Response({'message': 'Team deleted successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def member_list(request):
    if request.method == 'GET':
        team_id = request.query_params.get('team_id')
        query = Employees.objects.all()
        if team_id:
            query = query.filter(team_id=team_id)
        
        members = list(query)
        if not team_id and len(members) > 6:
            members = random.sample(members, 6)
            
        return Response([{
            'id': m.id,
            'employee_id': m.employee_id,
            'name': f"{m.first_name} {m.last_name}",
            'role': m.role,
            'status': m.status or 'Active',
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
                if not is_authorized and (acting_emp.role == 'Admin' or acting_emp.first_name == 'Admin'):
                    is_authorized = True
                    
                if not is_authorized:
                    return Response({'error': 'Unauthorized. Only the Team Leader of this team can add members.'}, status=403)
            except Employees.DoesNotExist:
                return Response({'error': 'Acting user not found'}, status=403)
            except Exception as e:
                print(f"Permission check error: {e}")

        data = request.data
        try:
            if Employees.objects.filter(email=data.get('email')).exists():
                return Response({'error': f"Employee with email '{data.get('email')}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            full_name = data.get('name', '').split(' ')
            first_name = data.get('first_name') or (full_name[0] if full_name else '')
            last_name = data.get('last_name') or (' '.join(full_name[1:]) if len(full_name) > 1 else '')

            # Get Team
            team_id = data.get('team_id')
            team = None
            if team_id:
                try:
                    team = Teams.objects.get(id=team_id)
                except Teams.DoesNotExist:
                    pass

            employee = Employees.objects.create(
                id=data.get('id'),
                first_name=first_name,
                last_name=last_name,
                role=data.get('role'),
                status='Active',
                location=data.get('location'),
                email=data.get('email'),
                contact=data.get('contact'),
                aadhar=data.get('aadhar'),
                team=team
            )
            return Response({'message': 'Employee added successfully', 'id': employee.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def registry_list(request):
    members = Employees.objects.all().order_by('id')
    serializer = EmployeesSerializer(members, many=True)
    return Response(serializer.data)

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
                
                # Check if they are a manager of the target team
                is_authorized = Teams.objects.filter(id=new_team_id, manager=acting_emp).exists()
                # Also allow if they are Admin
                if not is_authorized and (acting_emp.role == 'Admin' or acting_emp.first_name == 'Admin'):
                    is_authorized = True
                    
                if not is_authorized:
                    return Response({'error': 'Unauthorized. Only the Team Leader of this team can add/view members.'}, status=403)
            except Employees.DoesNotExist:
                return Response({'error': 'Acting user not found'}, status=403)
            except Exception as e:
                print(f"Permission check error: {e}")
                pass # Continue if check fails for other reasons for now to avoid blocking

        data = request.data
        try:
            employee.first_name = data.get('first_name', employee.first_name)
            if 'last_name' in data: employee.last_name = data['last_name']
            if 'role' in data: employee.role = data['role']
            if 'contact' in data: employee.contact = data['contact']
            if 'email' in data: employee.email = data['email']
            if 'aadhar' in data: employee.aadhar = data['aadhar']
            if 'location' in data: employee.location = data['location']
            if 'status' in data: employee.status = data['status']
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
    team_id = request.query_params.get('team_id')
    query = Employees.objects.all()
    if team_id:
        query = query.filter(team_id=team_id)
        
    members = query.all()
    member_ids = [m.id for m in members]
    
    total = len(members)
    active = query.filter(status='Active').count()
    on_leave = query.filter(status='On Leave').count()
    remote = query.filter(status='Remote').count()
    
    now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    monday = now - timedelta(days=now.weekday())
    monday_str = monday.strftime('%Y-%m-%d')
    
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
    
    return Response({
        'total': total,
        'active': active,
        'onLeave': on_leave,
        'remote': remote,
        'avg_working_hours': avg_working_hours,
        'on_time_arrival': on_time_arrival
    })

@api_view(['GET'])
def dashboard_stats(request):
    try:
        india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
        current_date_str = india_time.strftime('%Y-%m-%d')
        
        active_employees = Employees.objects.filter(status='Active')
        total_count = active_employees.count()
        
        # Get IDs of employees who have attendance records for today with a valid check-in
        # Accessing the related field's to_field value directly
        present_employee_ids = Attendance.objects.filter(
            date=current_date_str,
            check_in__isnull=False
        ).exclude(check_in='-').values_list('employee', flat=True)
        
        # Absentees are active employees not in the present list (Compare employee_id strings)
        absentees = active_employees.exclude(employee_id__in=present_employee_ids)
        absentees_count = absentees.count()
        
        absentees_list = [{
            'id': emp.id,
            'employee_id': emp.employee_id,
            'name': f"{emp.first_name} {emp.last_name}",
            'role': emp.role,
            'location': emp.location
        } for emp in absentees]
        
        return Response({
            'total_employees': total_count,
            'absentees_count': absentees_count,
            'absentees': absentees_list
        })
    except Exception as e:
        print(f"Error in dashboard_stats: {str(e)}")
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
