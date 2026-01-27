from rest_framework import serializers
from core.models import Employees, Teams, Leaves, Attendance, AttendanceLogs, Posts, PostComments, PostImages, PostLikes

class TeamsSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Teams
        fields = ['id', 'name', 'description', 'manager', 'manager_name', 'member_count']

    def get_member_count(self, obj):
        return Employees.objects.filter(team=obj).count()

    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return "Unassigned"

class EmployeesSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Employees
        fields = ['id', 'first_name', 'last_name', 'name', 'role', 'status', 'location', 'email', 'contact', 'aadhar', 'qualification', 'team']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class LeavesSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    fromDate = serializers.CharField(source='from_date')
    toDate = serializers.CharField(source='to_date')
    applied_on = serializers.SerializerMethodField()

    class Meta:
        model = Leaves
        fields = ['id', 'employee', 'employee_name', 'type', 'fromDate', 'toDate', 'days', 'reason', 'status', 'applied_on']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_applied_on(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%Y-%m-%d')
        return None

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class AttendanceLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLogs
        fields = '__all__'

class PostCommentsSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = PostComments
        fields = ['id', 'author', 'content', 'created_at']

    def get_author(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

class PostsSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    comments = PostCommentsSerializer(source='postcomments_set', many=True, read_only=True)

    class Meta:
        model = Posts
        fields = ['id', 'author', 'content', 'images', 'type', 'created_at', 'likes_count', 'likes', 'comments']

    def get_author(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}"

    def get_images(self, obj):
        return [img.image_url for img in PostImages.objects.filter(post=obj)]

    def get_likes_count(self, obj):
        return PostLikes.objects.filter(post=obj).count()

    def get_likes(self, obj):
        return [l.employee.id for l in PostLikes.objects.filter(post=obj)]
