"""
URL configuration for tessera project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
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
from django.urls import path
from scheduler import views_api
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/courses/', views_api.get_courses),
    path('api/courses/create/', views_api.create_course),
    path('api/sections/', views_api.get_sections),
    path('api/sections/create/', views_api.create_section),
    path('api/generate-schedules/', views_api.generate_schedules_api),
    path('api/docs/', include_docs_urls(title='Tessera API')),
]
