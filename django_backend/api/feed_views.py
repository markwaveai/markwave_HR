from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Posts
from .serializers import PostsSerializer
from datetime import datetime

@api_view(['GET', 'POST'])
def post_list(request):
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

        if author.role != 'Admin':
            return Response({'error': 'Unauthorized. Only admins can post.'}, status=status.HTTP_403_FORBIDDEN)

        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

        post = Posts.objects.create(
            author=author,
            content=content,
            type=post_type,
            images=images_data,
            created_at=datetime.utcnow()
        )
            
        return Response({'message': 'Post created successfully', 'id': post.id})

@api_view(['POST'])
def toggle_like(request, post_id):
    data = request.data
    employee_id = str(data.get('employee_id'))

    try:
        post = Posts.objects.get(pk=post_id)
        likes = post.likes or []
        
        # Check if internal ID or employee_id is in likes
        employee = Employees.objects.filter(employee_id=employee_id).first()
        if not employee and str(employee_id).isdigit():
            employee = Employees.objects.filter(pk=employee_id).first()
        
        target_id = employee.employee_id if employee else employee_id

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
            "id": len(comments) + 1,
            "author": f"{employee.first_name} {employee.last_name}",
            "author_id": employee.employee_id,
            "content": content,
            "created_at": datetime.utcnow().isoformat()
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
