from rest_framework import serializers
from core.models import Employees, Teams, Leaves, Attendance, AttendanceLogs, Posts

class TeamsSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Teams
        fields = ['id', 'name', 'description', 'manager', 'manager_name', 'member_count']

    def get_member_count(self, obj):
        return Employees.objects.filter(teams=obj, status__in=['Active', 'Remote']).count()

    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return "Unassigned"

class EmployeesSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Employees
        fields = ['id', 'employee_id', 'first_name', 'last_name', 'name', 'role', 'status', 'location', 'email', 'contact', 'aadhar', 'qualification', 'teams']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class LeavesSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    fromDate = serializers.CharField(source='from_date')
    toDate = serializers.CharField(source='to_date')
    applied_on = serializers.SerializerMethodField()

    class Meta:
        model = Leaves
        fields = ['id', 'employee', 'employee_id', 'employee_name', 'type', 'fromDate', 'toDate', 'days', 'from_session', 'to_session', 'reason', 'status', 'applied_on']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_employee_id(self, obj):
        return obj.employee.employee_id

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

class PostsSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Posts
        fields = ['id', 'author', 'content', 'images', 'type', 'created_at', 'likes_count', 'likes', 'comments']

    def get_author(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}"

    def get_likes_count(self, obj):
        return len(obj.likes) if obj.likes else 0
