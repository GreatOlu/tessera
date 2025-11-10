from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Course, CourseSection
from .serializers import CourseSerializer, CourseSectionSerializer
from .utils import has_conflict
import itertools

@api_view(['GET'])
def get_courses(request):
    courses = Course.objects.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_sections(request):
    sections = CourseSection.objects.all()
    serializer = CourseSectionSerializer(sections, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def generate_schedules_api(request):
    selected_ids = request.data.get('selected_courses', [])
    sections = list(CourseSection.objects.filter(course__id__in=selected_ids).select_related('course'))

    valid_schedules = []

    for r in range(2, min(6, len(sections) + 1)):
        for combo in itertools.combinations(sections, r):
            if len(set(s.course.id for s in combo)) != len(combo):
                continue
            if any(has_conflict(a, b) for i, a in enumerate(combo) for b in combo[i+1:]):
                continue
            total_credits = sum(s.course.credits for s in combo)
            if 12 <= total_credits <= 18:
                valid_schedules.append({
                    "sections": CourseSectionSerializer(combo, many=True).data,
                    "total_credits": total_credits
                })

    return Response(valid_schedules)
