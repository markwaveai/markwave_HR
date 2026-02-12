from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Posts
from .serializers import PostsSerializer
from datetime import datetime
from django.utils import timezone
from django.db.models import Q

@api_view(['GET', 'POST'])
def post_list(request):
    try:
        if request.method == 'GET':
            posts = Posts.objects.all().order_by('-created_at')
            serializer = PostsSerializer(posts, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data
            author_id = data.get('author_id')
            content = data.get('content')
            images_data = data.get('images', [])
            post_type = data.get('type', 'Activity')

            author = Employees.objects.filter(employee_id=author_id).first()
            if not author and str(author_id).isdigit():
                author = Employees.objects.filter(pk=author_id).first()
            
            if not author:
                return Response({'error': f'Author with ID {author_id} not found'}, status=status.HTTP_404_NOT_FOUND)

            # Allow any valid employee to post
            pass

            if not content and not images_data:
                return Response({'error': 'Content or at least one image is required'}, status=status.HTTP_400_BAD_REQUEST)

            post = Posts.objects.create(
                author=author,
                content=content,
                type=post_type,
                images=images_data,
                created_at=timezone.now()
            )
                
            return Response({'message': 'Post created successfully', 'id': post.id})
    except Exception as e:
        import traceback
        return Response({'error': str(e), 'traceback': traceback.format_exc()}, status=500)

@api_view(['POST'])
def toggle_like(request, post_id):
    data = request.data
    employee_id = data.get('employee_id')

    if not employee_id:
        return Response({'error': 'Employee ID required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Posts.objects.get(pk=post_id)
        likes = post.likes or []
        
        # Standardize on MW-style employee_id
        employee = Employees.objects.filter(Q(employee_id=employee_id) | Q(pk=employee_id if str(employee_id).isdigit() else -1)).first()
        
        if not employee:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
            
        target_id = employee.employee_id

        if str(target_id) in likes:
            likes.remove(str(target_id))
            message = 'Unliked'
        else:
            likes.append(str(target_id))
            message = 'Liked'
        
        post.likes = likes
        post.save()
        return Response({'message': message})
    except Posts.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def add_comment(request, post_id):
    data = request.data
    employee_id = str(data.get('employee_id'))
    content = data.get('content')

    if not content:
        return Response({'error': 'Comment content required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Posts.objects.get(pk=post_id)
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        if not employee:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        
        comments = post.comments or []
        new_comment = {
            "id": max([c.get('id', 0) for c in comments], default=0) + 1,
            "author": f"{employee.first_name} {employee.last_name}",
            "author_id": employee.employee_id,
            "content": content,
            "created_at": timezone.now().isoformat()
        }
        comments.append(new_comment)
        post.comments = comments
        post.save()
        
        return Response({'message': 'Comment added successfully', 'id': new_comment['id']})
    except (Posts.DoesNotExist, Employees.DoesNotExist):
        return Response({'error': 'Post or Employee not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def post_detail(request, post_id):
    try:
        post = Posts.objects.get(pk=post_id)
        post.delete()
        return Response({'message': 'Post deleted successfully'})
    except Posts.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def delete_comment(request, post_id, comment_id):
    try:
        post = Posts.objects.get(pk=post_id)
        comments = post.comments or []
        
        # Find the comment
        comment_to_delete = next((c for c in comments if c.get('id') == comment_id), None)
        
        if not comment_to_delete:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check permission: Author of comment OR Admin
        requester_id = str(request.GET.get('employee_id', '')) # Passed as query param or from token if available
        # But wait, request.user might be available if using TokenAuth? 
        # The current app seems to pass employee_id manually in body/query sometimes.
        # Let's check how other delete ops work. handleDeletePost passes nothing? It uses view protection?
        # Actually, add_comment uses body. delete_post uses URL.
        # We need to identify the requester.
        # For simplicity, let's accept employee_id in query params as a basic check, 
        # or rely on frontend to only show button to valid users (weak security but consistent with current app state).
        # Better: Require employee_id in query params.
        
        if not requester_id:
             return Response({'error': 'Requester ID required'}, status=status.HTTP_400_BAD_REQUEST)
             
        # Fetch requester for name check and admin check
        requester = Employees.objects.filter(employee_id=requester_id).first()
        if not requester:
             return Response({'error': 'Requester not found'}, status=status.HTTP_404_NOT_FOUND)

        is_author = str(comment_to_delete.get('author_id')) == requester_id
        
        # Fallback: Check name match for legacy comments
        if not is_author:
             requester_name = f"{requester.first_name} {requester.last_name}"
             if comment_to_delete.get('author') == requester_name:
                 is_author = True

        if not is_author:
             is_admin = requester.role in ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations']
             
             if not is_admin:
                 return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Remove comment
        post.comments = [c for c in comments if c.get('id') != comment_id]
        post.save()
        
        return Response({'message': 'Comment deleted successfully'})
        
    except Posts.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
