from django.db import models


class Attendance(models.Model):
    id = models.AutoField(primary_key=True)
    employee = models.ForeignKey('Employees', models.DO_NOTHING, to_field='employee_id', null=True, blank=True)
    date = models.CharField(max_length=10)
    check_in = models.CharField(max_length=20, blank=True, null=True)
    check_out = models.CharField(max_length=20, blank=True, null=True)
    break_minutes = models.IntegerField(blank=True, null=True)
    worked_hours = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    is_weekend = models.BooleanField(blank=True, null=True)
    is_holiday = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'core_attendance'
        unique_together = (('employee', 'date'),)


class AttendanceLogs(models.Model):
    id = models.AutoField(primary_key=True)
    employee = models.ForeignKey('Employees', models.DO_NOTHING, to_field='employee_id', null=True, blank=True)
    timestamp = models.DateTimeField()
    type = models.CharField(max_length=10, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    date = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'core_attendancelog'


class Employees(models.Model):
    id = models.AutoField(primary_key=True)
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True)
    contact = models.CharField(max_length=20, blank=True, null=True)
    aadhar = models.CharField(max_length=20, blank=True, null=True)
    qualification = models.CharField(max_length=100, blank=True, null=True)
    # team = models.ForeignKey('Teams', models.DO_NOTHING, blank=True, null=True)
    teams = models.ManyToManyField('Teams', blank=True, related_name='members')
    joining_date = models.DateField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'core_employee'


class Leaves(models.Model):
    id = models.AutoField(primary_key=True)
    employee = models.ForeignKey(Employees, models.DO_NOTHING, to_field='employee_id')
    type = models.CharField(max_length=20)
    from_date = models.CharField(max_length=10)
    to_date = models.CharField(max_length=10)
    days = models.FloatField()
    reason = models.TextField(blank=True, null=True)
    from_session = models.CharField(max_length=20, blank=True, null=True)
    to_session = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'core_leaverequest'


class Posts(models.Model):
    author = models.ForeignKey(Employees, models.DO_NOTHING, to_field='employee_id')
    content = models.TextField()
    type = models.CharField(max_length=20, blank=True, null=True)
    images = models.JSONField(default=list, blank=True)
    likes = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'core_posts'


class Teams(models.Model):
    name = models.CharField(unique=True, max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)
    manager = models.ForeignKey(Employees, models.DO_NOTHING, to_field='employee_id', blank=True, null=True, related_name='managed_teams')
    shift_start = models.CharField(max_length=20, default='09:30 AM')
    shift_end = models.CharField(max_length=20, default='06:30 PM')
    whatsapp_chat_id = models.CharField(max_length=100, blank=True, null=True)
    whatsapp_group_url = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'core_team'


class Regularization(models.Model):
    id = models.AutoField(primary_key=True)
    employee = models.ForeignKey(Employees, models.DO_NOTHING, to_field='employee_id')
    attendance = models.ForeignKey(Attendance, models.CASCADE)
    requested_checkout = models.CharField(max_length=20)
    reason = models.TextField()
    status = models.CharField(max_length=20, default='Pending')  # Pending, Approved, Rejected
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'core_regularization'


class Holidays(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.CharField(max_length=10)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    is_optional = models.BooleanField(default=False)

    class Meta:
        managed = True
        db_table = 'core_holidays'


class LeaveType(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    days_per_year = models.FloatField()
    carry_forward = models.BooleanField(default=False)
    encashment = models.BooleanField(default=False)

    class Meta:
        managed = True
        db_table = 'core_leavetype'


class EmployeeLeaveBalance(models.Model):
    employee = models.ForeignKey(Employees, models.CASCADE)
    leave_type = models.ForeignKey(LeaveType, models.CASCADE)
    year = models.IntegerField()
    allocated_days = models.FloatField(default=0)
    consumed_days = models.FloatField(default=0) # Optional cache, but calculation on fly is safer for consistency

    class Meta:
        managed = True
        db_table = 'core_employeeleavebalance'
        unique_together = (('employee', 'leave_type', 'year'),)


class WorkFromHome(models.Model):
    employee = models.ForeignKey(Employees, models.DO_NOTHING, to_field='employee_id')
    from_date = models.CharField(max_length=10)
    to_date = models.CharField(max_length=10)
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Pending')  # Pending, Approved, Rejected
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'core_wfh'
