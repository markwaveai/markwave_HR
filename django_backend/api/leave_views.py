from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Leaves, Employees
from .serializers import LeavesSerializer
from django.db.models import Q, Sum

@api_view(['GET'])
def get_leaves(request, employee_id):
    leaves = Leaves.objects.filter(employee_id=employee_id).order_by('-created_at')
    serializer = LeavesSerializer(leaves, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def apply_leave(request):
    data = request.data
    employee_id = data.get('employeeId')
    from_date = data.get('fromDate')
    to_date = data.get('toDate')
    leave_type = data.get('type')
    days = data.get('days')

    LEAVE_LIMITS = {'cl': 6, 'sl': 6, 'el': 17}

    # Check for overlapping leaves
    existing_overlap = Leaves.objects.filter(
        employee_id=employee_id,
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
            employee_id=employee_id,
            type=leave_type,
            status__in=['Pending', 'Approved']
        ).aggregate(total=Sum('days'))['total'] or 0
        
        if used_days + days > limit:
             return Response({'error': 'Insufficient leave balance. You cannot apply for more leave than your available balance.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from django.utils import timezone
        new_request = Leaves.objects.create(
            employee_id=employee_id,
            type=leave_type,
            from_date=from_date,
            to_date=to_date,
            days=days,
            reason=data.get('reason', ''),
            status='Pending',
            created_at=timezone.now()
        )
        return Response({'message': 'Leave request submitted', 'id': new_request.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    LEAVE_LIMITS = {'cl': 6, 'sl': 6, 'el': 17}
    
    used_leaves = Leaves.objects.filter(
        employee_id=employee_id,
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
