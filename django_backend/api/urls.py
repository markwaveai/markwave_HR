from django.urls import path
from . import views, team_views, leave_views, attendance_views, feed_views

urlpatterns = [
    # Auth
    path('auth/login/', views.login, name='login'),
    path('auth/send-otp/', views.send_otp, name='send_otp'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),
    path('auth/send-email-otp/', views.send_email_otp, name='send_email_otp'),
    path('auth/verify-email-otp/', views.verify_email_otp, name='verify_email_otp'),
    path('auth/profile/<str:employee_id>/', views.get_profile, name='get_profile'),
    
    # Team
    path('team/', team_views.team_list, name='team-list'),
    path('team/<int:pk>/', team_views.team_detail, name='team-detail'),
    path('team/members/', team_views.member_list, name='member-list'),
    path('team/members/<str:pk>/', team_views.member_detail, name='member-detail'),
    path('team/registry/', team_views.registry_list, name='registry-list'),
    path('team/stats/', team_views.team_stats, name='team-stats'),
    path('team/designations/', team_views.designation_list, name='designation-list'),
    path('admin/dashboard-stats/', team_views.dashboard_stats, name='dashboard-stats'),
    
    # Leaves
    path('leaves/apply/', leave_views.apply_leave, name='apply-leave'),
    path('leaves/pending/', leave_views.get_pending_leaves, name='get-pending-leaves'),
    path('leaves/balance/<str:employee_id>/', leave_views.get_leave_balance, name='get-leave-balance'),
    path('leaves/<str:employee_id>/', leave_views.get_leaves, name='get-leaves'),
    path('leaves/<int:request_id>/action/', leave_views.leave_action, name='leave-action'),
    path('leaves/email-action/<int:request_id>/<str:action>/', leave_views.email_leave_action, name='email-leave-action'),
    
    # Attendance
    path('attendance/resolve-location/', attendance_views.resolve_location, name='resolve-location'),
    path('attendance/clock/', attendance_views.clock, name='clock'),
    path('attendance/status/<str:employee_id>/', attendance_views.get_status, name='get-status'),
    path('attendance/stats/<str:employee_id>/', attendance_views.get_personal_stats, name='get-personal-stats'),
    path('attendance/history/<str:employee_id>/', attendance_views.get_history, name='get-history'),
    path('attendance/regularize/', attendance_views.submit_regularization, name='submit-regularization'),
    path('attendance/regularization-requests/<str:manager_id>/', attendance_views.get_regularization_requests, name='get-regularization-requests'),
    path('attendance/regularization/<int:pk>/action/', attendance_views.action_regularization, name='action-regularization'),
    path('holidays/', attendance_views.get_holidays, name='get-holidays'),
    
    # Feed
    path('posts/', feed_views.post_list, name='post-list'),
    path('posts/<int:post_id>/', feed_views.post_detail, name='post-detail'),
    path('posts/<int:post_id>/like/', feed_views.toggle_like, name='toggle-like'),
    path('posts/<int:post_id>/comment/', feed_views.add_comment, name='add-comment'),
]
