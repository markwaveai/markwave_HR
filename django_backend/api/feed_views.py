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

        try:
            author = Employees.objects.get(pk=author_id)
        except Employees.DoesNotExist:
            return Response({'error': 'Author not found'}, status=status.HTTP_404_NOT_FOUND)

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
        
        if employee_id in likes:
            likes.remove(employee_id)
            message = 'Unliked'
        else:
            likes.append(employee_id)
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
        employee = Employees.objects.get(pk=employee_id)
        
        comments = post.comments or []
        new_comment = {
            "id": len(comments) + 1,
            "author": f"{employee.first_name} {employee.last_name}",
            "author_id": employee_id,
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
