import random
import os
import traceback
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from core.models import Teams, Employees, Attendance, Leaves, WorkFromHome
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

from .utils import create_whatsapp_group, add_whatsapp_participant, remove_whatsapp_participant
import io
from PIL import Image
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

def process_profile_picture(image_file):
    """
    Processes the uploaded image:
    1. Opens it using PIL (supporting HEIC via pillow-heif)
    2. Converts to RGB if necessary
    3. Resizes if too large (optional, but good for profile pics)
    4. Saves as JPEG in a BytesIO object
    """
    try:
        img = Image.open(image_file)
        
        # Convert to RGB (removes alpha channel if PNG, or handles HEIC/P)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Optional: Resize if larger than 800x800
        max_size = (800, 800)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to BytesIO as JPEG
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85)
        output.seek(0)
        
        # Replace the original file content
        from django.core.files.base import ContentFile
        return ContentFile(output.read(), name=f"{os.path.splitext(image_file.name)[0]}.jpg")
    except Exception as e:
        print(f"Error processing image: {e}")
        import traceback
        traceback.print_exc()
        return image_file # Fallback to original if processing fails

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
            
            # --- WhatsApp Group & Member Addition Logic ---
            member_ids = data.get('members', [])
            participants_to_sync = []
            
            # 1. Add Members to DB and prepare for sync
            if member_ids:
                if isinstance(member_ids, str):
                    member_ids = [m.strip() for m in member_ids.split(',') if m.strip()]
                
                # Filter valid IDs
                members_to_add = Employees.objects.filter(id__in=member_ids)
                for member in members_to_add:
                    member.teams.add(team)
                    if member.contact:
                        participants_to_sync.append(member)

            # --- WhatsApp Group & Member Addition Logic Removed ---
            return Response({'message': 'Team created successfully', 'id': team.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            if 'unique constraint' in str(e).lower() or 'duplicate key' in str(e).lower():
                return Response({'error': 'A team with this name already exists.'}, status=status.HTTP_400_BAD_REQUEST)
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
        search = request.query_params.get('search')
        
        query = Employees.objects.filter(status__in=['Active', 'Remote'])
        
        if team_id:
            # Filter members of the team
            query = query.filter(teams__id=team_id).distinct()
            
        if search:
            from django.db.models import Q
            query = query.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) | 
                Q(employee_id__icontains=search)
            )
        
        members = list(query)
        # Only limit random sample if not searching and not specific team
        if not team_id and not search and len(members) > 6:
            members = random.sample(members, 6)
            
        india_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
        current_date_str = india_time.strftime('%Y-%m-%d')
        
        # Get approved leaves for today for these members
        member_ids = [m.employee_id for m in members]
        on_leave_ids = set(Leaves.objects.filter(
            employee_id__in=member_ids,
            status__iexact='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).values_list('employee_id', flat=True))

        # Get approved WFH for today for these members (Remote status)
        on_wfh_ids = set(WorkFromHome.objects.filter(
            employee_id__in=member_ids,
            status__iexact='Approved',
            from_date__lte=current_date_str,
            to_date__gte=current_date_str
        ).values_list('employee_id', flat=True))

        # Get today's attendance records to determine who is "Present" (Active Now)
        attendance_map = {
            a['employee_id']: a['status'] 
            for a in Attendance.objects.filter(
                employee_id__in=member_ids, 
                date=current_date_str
            ).values('employee_id', 'status')
        }
            
        # Get team manager ID if team_id is provided
        team_manager_id = None
        if team_id:
            try:
                team_obj = Teams.objects.get(id=team_id)
                team_manager_id = team_obj.manager.employee_id if team_obj.manager else None
            except Teams.DoesNotExist:
                pass

        return Response([{
            'id': m.id,
            'employee_id': m.employee_id,
            'name': f"{m.first_name} {m.last_name}",
            'role': m.role,
            'status': 'Leave' if m.employee_id in on_leave_ids else ('Remote' if m.employee_id in on_wfh_ids else ('Active' if attendance_map.get(m.employee_id) == 'Present' else 'Absent')),
            'location': m.location,
            'email': m.email,
            'is_manager': m.employee_id == team_manager_id,
            'profile_picture': request.build_absolute_uri(m.profile_picture.url) if m.profile_picture else None
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
            # 1. Mandatory Fields & Format Check
            required_fields = ['first_name', 'email', 'employee_id', 'contact', 'aadhar', 'location', 'role']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f"Field '{field}' is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            contact = str(data.get('contact'))
            aadhar = str(data.get('aadhar'))

            if not contact.isdigit() or len(contact) != 10:
                return Response({'error': "Contact number must be exactly 10 digits."}, status=status.HTTP_400_BAD_REQUEST)
            if contact == '0' * 10:
                return Response({'error': "Contact number cannot be all zeros."}, status=status.HTTP_400_BAD_REQUEST)

            if not aadhar.isdigit() or len(aadhar) != 12:
                return Response({'error': "Aadhar number must be exactly 12 digits."}, status=status.HTTP_400_BAD_REQUEST)
            if aadhar == '0' * 12:
                return Response({'error': "Aadhar number cannot be all zeros."}, status=status.HTTP_400_BAD_REQUEST)

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

@api_view(['PUT', 'PATCH', 'DELETE', 'POST'])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def member_detail(request, pk):
    try:
        # 1. Try exact employee_id match first (preferred)
        employee = Employees.objects.filter(employee_id=pk).first()
        
        # 2. Fallback to Primary Key if not found as employee_id and is numeric
        if not employee and str(pk).isdigit():
            employee = Employees.objects.filter(id=pk).first()
            
        if not employee:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f"Error finding employee: {str(e)}"}, status=500)

    if request.method in ['PUT', 'PATCH', 'POST']:
        # Permission check: Only manager of the team or Admin can add/update
        # Also allow if the user is updating THEIR OWN profile
        acting_user_id = request.data.get('acting_user_id')
        new_team_id = request.data.get('team_id')
        
        is_authorized = False
        
        if acting_user_id:
            try:
                # Get the person doing the action
                if str(acting_user_id).isdigit():
                    acting_emp = Employees.objects.get(id=acting_user_id)
                else:
                    acting_emp = Employees.objects.get(employee_id=acting_user_id)
                
                # 1. Broad Admin Check (role-based)
                if is_user_admin(acting_emp):
                    is_authorized = True
                
                # 2. Allow self-update
                if acting_emp.id == employee.id:
                    is_authorized = True
                
                # 3. Allow any team manager (manages at least one team)
                if not is_authorized and Teams.objects.filter(manager=acting_emp).exists():
                    is_authorized = True
                
                if not is_authorized:
                    # 4. Check if they are the manager of ANY of member's CURRENT teams
                    if employee.teams.filter(manager=acting_emp).exists():
                        is_authorized = True
                    
                    # 5. Check if they are the manager of the member's NEW target team
                    if not is_authorized and new_team_id:
                        if Teams.objects.filter(id=new_team_id, manager=acting_emp).exists():
                            is_authorized = True
            except Employees.DoesNotExist:
                return Response({'error': 'Acting user not found'}, status=403)
            except Exception as e:
                print(f"Permission check error: {e}")
        else:
            # No acting_user_id provided — allow (e.g. profile picture updates, admin tools)
            is_authorized = True
        
        # For profile picture updates from the app, acting_user_id might be missing in the multipart form.
        if not acting_user_id and 'profile_picture' in request.FILES:
            is_authorized = True

        if not is_authorized:
            return Response({'error': 'Unauthorized. Only the Team Leader or an Admin can manage members.'}, status=403)

        data = request.data

        # Data Validation
        contact = data.get('contact')
        if contact:
            contact_str = str(contact)
            if not contact_str.isdigit() or len(contact_str) != 10:
                return Response({'error': "Contact number must be exactly 10 digits."}, status=status.HTTP_400_BAD_REQUEST)
            if contact_str == '0' * 10:
                return Response({'error': "Contact number cannot be all zeros."}, status=status.HTTP_400_BAD_REQUEST)
        
        aadhar = data.get('aadhar')
        if aadhar:
            aadhar_str = str(aadhar)
            if not aadhar_str.isdigit() or len(aadhar_str) != 12:
                return Response({'error': "Aadhar number must be exactly 12 digits."}, status=status.HTTP_400_BAD_REQUEST)
            if aadhar_str == '0' * 12:
                return Response({'error': "Aadhar number cannot be all zeros."}, status=status.HTTP_400_BAD_REQUEST)

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
            if 'qualification' in data: employee.qualification = data['qualification']
            
            if 'profile_picture' in request.FILES:
                processed_image = process_profile_picture(request.FILES['profile_picture'])
                employee.profile_picture = processed_image
            
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
            serializer = EmployeesSerializer(employee, context={'request': request})
            return Response({'message': 'Employee updated successfully', 'member': serializer.data})
        except Exception as e:
            print(f"Error in member_detail: {e}")
            import traceback
            traceback.print_exc()
            error_msg = str(e)
            if "too many clients" in error_msg or "connection to server" in error_msg:
                return Response({'error': 'Database connection limit reached. Please try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)

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
        
        duration = request.query_params.get('duration', 'This Week')
        
        query = Employees.objects.filter(status__in=['Active', 'Remote'])
        if team_ids:
            query = query.filter(teams__id__in=team_ids)
            
        members = query.all()
        member_ids = [m.employee_id for m in members]
        
        total = len(members)
        now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        today_date = now.strftime('%Y-%m-%d')
        
        # Determine start date based on duration
        if duration == 'Today':
            start_date_str = today_date
        elif duration == 'This Month':
            start_date = now.replace(day=1)
            start_date_str = start_date.strftime('%Y-%m-%d')
        else: # This Week (Default)
            monday = now - timedelta(days=now.weekday())
            start_date_str = monday.strftime('%Y-%m-%d')
        
        # Calculate On Leave from Leaves table
        # Note: Leaves might need to be filtered by the duration range too, but usually "On Leave" status implies *currently* on leave or relevant to the period.
        # For simple stats, we often look at "Current Status". 
        # However, if we want "Avg Hours" over a month, "On Leave" count is less relevant than "Total Absent Days".
        # But keeping existing logic for "On Leave" count as "People currently on leave" seems safer for now unless specified.
        # The original code filtered leaves intersecting with TODAY. Let's keep that for the "Status Cards" usually show current state.
        
        on_leave_ids = Leaves.objects.filter(
            employee__employee_id__in=list(query.values_list('employee_id', flat=True)),
            status='Approved',
            from_date__lte=today_date,
            to_date__gte=today_date
        ).values_list('employee', flat=True).distinct()
        
        on_leave = on_leave_ids.count()
        
        # Active Now = Members who have clocked in TODAY (status='Present' in Attendance)
        active = Attendance.objects.filter(
            employee_id__in=member_ids,
            date=today_date,
            status='Present'
        ).count()
        
        attendance_records = Attendance.objects.filter(
            employee__employee_id__in=list(query.values_list('employee_id', flat=True)),
            date__gte=start_date_str
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
        
        # Remote count = Employees with status 'Remote' OR approved WFH today
        wfh_count = WorkFromHome.objects.filter(
            employee__employee_id__in=member_ids,
            status__iexact='Approved',
            from_date__lte=today_date,
            to_date__gte=today_date
        ).values('employee').distinct().count()
        
        remote = query.filter(status='Remote').count() + wfh_count

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
        
        # Static bypass for empty database/demo
        if total_count == 0:
            return Response({
                'total_employees': 5,
                'absentees_count': 1,
                'absentees': [{
                    'id': 101,
                    'employee_id': 'MW-001',
                    'name': 'John Doe',
                    'role': 'Developer',
                    'location': 'Remote',
                    'status': 'Absent'
                }],
                'all_employees': [],
                'avg_working_hours': '8h 30m',
                'lastWeekDiff': '+0h 15m',
                'on_time_arrival': '95%'
            })
        
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
        
        # Pre-fetch all attendance for the two week range
        stats_records = Attendance.objects.filter(
            date__gte=last_mon.strftime('%Y-%m-%d'),
            date__lte=this_sun.strftime('%Y-%m-%d')
        ).exclude(worked_hours__isnull=True).exclude(worked_hours='-').exclude(check_in__isnull=True).exclude(check_in='-')

        def calc_group_avg(records, start_dt, end_dt):
            start_str = start_dt.strftime('%Y-%m-%d')
            end_str = end_dt.strftime('%Y-%m-%d')
            total_mins = 0
            count = 0
            on_time_count = 0
            present_count = 0
            
            for s in records:
                if start_str <= s.date <= end_str:
                    # Parse worked_hours
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
                    
                    # Global On Time Arrival (only for this range)
                    present_count += 1
                    if s.check_in and ':' in s.check_in:
                        try:
                            t = datetime.strptime(s.check_in, '%I:%M %p')
                            cutoff = datetime.strptime('09:30 AM', '%I:%M %p')
                            if t <= cutoff:
                                on_time_count += 1
                        except:
                            pass
            
            avg = total_mins / count if count > 0 else 0
            on_time_pct = (on_time_count / present_count * 100) if present_count > 0 else 0
            return avg, int(on_time_pct)

        avg_this, on_time_this = calc_group_avg(stats_records, this_mon, this_sun)
        avg_last, _ = calc_group_avg(stats_records, last_mon, last_sun)
        
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

        on_time_arrival = f"{on_time_this}%"

        # --- All Employees Status Logic ---
        all_employees_list = []
        for emp in active_employees:
            status = 'Absent'
            check_in = None
            
            if emp.employee_id in present_employee_ids:
                status = 'Present'
                # Find check-in time
                attendance_rec = Attendance.objects.filter(employee=emp, date=current_date_str).first()
                if attendance_rec and attendance_rec.check_in:
                    check_in = attendance_rec.check_in
            elif emp.employee_id in on_leave_set:
                status = 'On Leave'
            
            all_employees_list.append({
                'id': emp.id,
                'employee_id': emp.employee_id,
                'name': f"{emp.first_name} {emp.last_name}",
                'role': emp.role,
                'location': emp.location,
                'status': status,
                'check_in': check_in,
                'contact': emp.contact
            })

        return Response({
            'total_employees': total_count,
            'absentees_count': absentees_count,
            'absentees': absentees_list,
            'all_employees': all_employees_list,
            'avg_working_hours': avg_working_hours,
            'lastWeekDiff': last_week_diff,
            'on_time_arrival': on_time_arrival
        })
    except Exception as e:
        print(f"Error in dashboard_stats: {str(e)}")
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
