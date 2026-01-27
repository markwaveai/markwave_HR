import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.models import Employees
from django.db.models import Func, Value, CharField

def normalize_phone(phone_str):
    if not phone_str:
        return ""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', str(phone_str))
    
    # Handle standard Indian prefixes
    if len(digits) == 12 and digits.startswith('91'):
        return digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        return digits[1:]
        
    return digits

@api_view(['POST'])
def login(request):
    data = request.data
    phone = data.get('phone')
    password = data.get('password')

    if not phone or not password:
        return Response({'error': 'Phone number and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Default password check
    if password != '000000':
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if phone == 'admin':
        return Response({
            'success': True,
            'user': {
                'id': '0',
                'first_name': 'Admin',
                'last_name': 'User',
                'email': 'admin@markwave.com',
                'role': 'Administrator',
                'team_id': None,
                'avatar_url': None
            }
        })

    # Normalize input phone number
    normalized_input = normalize_phone(phone)
    if not normalized_input:
        return Response({'error': 'Invalid phone number format'}, status=status.HTTP_400_BAD_REQUEST)

    # Find employee by phone number
    # In Django, we can use Replace to normalize the contact field in the DB
    try:
        # Django equivalent of: db.func.replace(db.func.replace(Employee.contact, ' ', ''), '-', '') == normalized_input
        # We can use extra() or custom Func for this.
        
        employees = Employees.objects.all()
        # Simple search first, then refine if needed
        employee = None
        for emp in employees:
            if normalize_phone(emp.contact) == normalized_input:
                employee = emp
                break
        
        if not employee:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'user': {
                'id': employee.id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'email': employee.email,
                'role': employee.role,
                'team_id': employee.team.id if employee.team else None
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
