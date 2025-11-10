from rest_framework import serializers
from .models import Course, CourseSection

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'code', 'title', 'credits']

class CourseSectionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    class Meta:
        model = CourseSection
        fields = ['id', 'course', 'section_number', 'days', 'start_time', 'end_time']
