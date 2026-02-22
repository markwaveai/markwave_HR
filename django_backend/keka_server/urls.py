"""
URL configuration for keka_server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from api import wfh_views, leave_views

urlpatterns = [
    path('ping/', lambda r: HttpResponse('pong')),
    path('admin/', admin.site.urls),
    # Redundant routes to bypass include() issues and catch both prefixed and non-prefixed requests
    path('api/wfh/email-action/<int:request_id>/<str:action>/', wfh_views.email_wfh_action),
    path('wfh/email-action/<int:request_id>/<str:action>/', wfh_views.email_wfh_action),
    path('api/leaves/email-action/<int:request_id>/<str:action>/', leave_views.email_leave_action),
    path('leaves/email-action/<int:request_id>/<str:action>/', leave_views.email_leave_action),
    path('api/', include('api.urls')),
    path('ping/', lambda r: HttpResponse('pong')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
