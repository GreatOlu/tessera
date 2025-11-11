from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import Course, CourseSection
from .utils import has_conflict
from .serializers import (
    CourseSerializer,
    CourseSectionWriteSerializer,
    CourseSectionReadSerializer,
)
import itertools


@api_view(['GET'])
def get_courses(request):
    courses = Course.objects.all().order_by('code')
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([])   # dev-only: allow POSTs from Vite without auth/CSRF
@permission_classes([AllowAny])
def create_course(request):
    ser = CourseSerializer(data=request.data)
    if ser.is_valid():
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_sections(request):
    sections = CourseSection.objects.select_related('course').all()
    return Response(CourseSectionReadSerializer(sections, many=True).data)

@api_view(['POST'])
@authentication_classes([])   # dev-only
@permission_classes([AllowAny])
def create_section(request):
    """
    Body:
    {
      "course_id": 1,
      "section_number": "01",
      "instructor": "Prof. Ada",
      "days": ["M","W"],
      "start_time": "09:00",
      "end_time": "10:15"
    }
    """
    wser = CourseSectionWriteSerializer(data=request.data)
    if wser.is_valid():
        sec = wser.save()
        rser = CourseSectionReadSerializer(sec)
        return Response(rser.data, status=status.HTTP_201_CREATED)
    return Response(wser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def generate_schedules_api(request):
    selected_ids = request.data.get('selected_courses', [])
    sections = list(
        CourseSection.objects
        .filter(course__id__in=selected_ids)
        .select_related('course')
    )

    valid_schedules = []

    for r in range(2, min(6, len(sections) + 1)):
        for combo in itertools.combinations(sections, r):
            # one section per course
            if len({s.course.id for s in combo}) != len(combo):
                continue

            # no time conflicts
            if any(has_conflict(a, b) for i, a in enumerate(combo) for b in combo[i+1:]):
                continue

            # credit range
            total_credits = sum(s.course.credits for s in combo)
            if 12 <= total_credits <= 18:
                valid_schedules.append({
                    "sections": CourseSectionReadSerializer(combo, many=True).data,
                    "total_credits": total_credits,
                })

    return Response(valid_schedules)