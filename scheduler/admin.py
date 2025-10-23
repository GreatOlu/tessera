from django.contrib import admin
from .models import Student, Course, CourseSection, Enrollment

admin.site.register(Student)
admin.site.register(Course)
admin.site.register(CourseSection)
admin.site.register(Enrollment)
