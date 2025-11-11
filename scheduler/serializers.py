from rest_framework import serializers
from .models import Course, CourseSection
import ast

DAY_CODES = ['M', 'T', 'W', 'Th', 'F']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'code', 'title', 'credits']

class CourseSectionWriteSerializer(serializers.ModelSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), source='course', write_only=True
    )

    days = serializers.ListField(
        child=serializers.ChoiceField(choices=DAY_CODES),
        write_only=True
    )

    class Meta:
        model = CourseSection
        fields = [
            'id',
            'course_id',
            'section_number',
            'instructor',
            'days',
            'start_time',
            'end_time',
        ]
        
    def validate(self, attrs):
        course = attrs.get('course')
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        days = attrs.get('days', [])

        if start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time.")

        existing_sections = CourseSection.objects.filter(course=course)

        for existing in existing_sections:
            existing_days = (
                existing.days if isinstance(existing.days, list)
                else [d.strip() for d in existing.days.split(',') if d.strip()]
            )

            if any(day in existing_days for day in days):
                if not (end_time <= existing.start_time or start_time >= existing.end_time):
                    raise serializers.ValidationError(
                        f"Time conflict with section {existing.section_number} ({existing.start_time}-{existing.end_time} on {existing.days})."
                    )

        return attrs

    def validate_days(self, value):
        """
        if the frontend sends a string, try to parse it into a list.
        """
        if isinstance(value, str):
            try:
                parsed = ast.literal_eval(value)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [v.strip() for v in value.split(',') if v.strip()]
        return value

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)

class CourseSectionReadSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    class Meta:
        model = CourseSection
        fields = ['id', 'course', 'section_number', 'instructor', 'days', 'start_time', 'end_time']