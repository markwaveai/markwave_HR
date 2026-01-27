from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import Employees, Posts, PostLikes, PostComments, PostImages
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
            created_at=datetime.utcnow()
        )

        for img_url in images_data:
            PostImages.objects.create(post=post, image_url=img_url)
            
        return Response({'message': 'Post created successfully', 'id': post.id})

@api_view(['POST'])
def toggle_like(request, post_id):
    data = request.data
    employee_id = data.get('employee_id')

    like = PostLikes.objects.filter(post_id=post_id, employee_id=str(employee_id)).first()
    if like:
        like.delete()
        message = 'Unliked'
    else:
        PostLikes.objects.create(post_id=post_id, employee_id=str(employee_id))
        message = 'Liked'

    return Response({'message': message})

@api_view(['POST'])
def add_comment(request, post_id):
    data = request.data
    employee_id = data.get('employee_id')
    content = data.get('content')

    if not content:
        return Response({'error': 'Comment content required'}, status=status.HTTP_400_BAD_REQUEST)

    comment = PostComments.objects.create(
        post_id=post_id,
        employee_id=str(employee_id),
        content=content,
        created_at=datetime.utcnow()
    )

    return Response({'message': 'Comment added successfully', 'id': comment.id})

@api_view(['DELETE'])
def post_detail(request, post_id):
    try:
        post = Posts.objects.get(pk=post_id)
        post.delete()
        return Response({'message': 'Post deleted successfully'})
    except Posts.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
