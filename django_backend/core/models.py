# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Attendance(models.Model):
    employee = models.OneToOneField('Employees', models.DO_NOTHING, primary_key=True)
    date = models.CharField(max_length=10)
    check_in = models.CharField(max_length=20, blank=True, null=True)
    check_out = models.CharField(max_length=20, blank=True, null=True)
    break_minutes = models.IntegerField(blank=True, null=True)
    worked_hours = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    is_weekend = models.BooleanField(blank=True, null=True)
    is_holiday = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'attendance'


class AttendanceLogs(models.Model):
    employee = models.OneToOneField('Employees', models.DO_NOTHING, primary_key=True)
    timestamp = models.DateTimeField()
    type = models.CharField(max_length=10, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    date = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'attendance_logs'


class Employees(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(unique=True, max_length=100, blank=True, null=True)
    contact = models.CharField(max_length=20, blank=True, null=True)
    aadhar = models.CharField(max_length=20, blank=True, null=True)
    qualification = models.CharField(max_length=100, blank=True, null=True)
    team = models.ForeignKey('Teams', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'employees'


class Leaves(models.Model):
    id = models.AutoField(primary_key=True)
    employee = models.ForeignKey(Employees, models.DO_NOTHING)
    type = models.CharField(max_length=20)
    from_date = models.CharField(max_length=10)
    to_date = models.CharField(max_length=10)
    days = models.FloatField()
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'leaves'


class Posts(models.Model):
    author = models.ForeignKey(Employees, models.DO_NOTHING)
    content = models.TextField()
    type = models.CharField(max_length=20, blank=True, null=True)
    images = models.JSONField(default=list, blank=True)
    likes = models.JSONField(default=list, blank=True)
    comments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'posts'


class Teams(models.Model):
    name = models.CharField(unique=True, max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)
    manager = models.ForeignKey(Employees, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'teams'
