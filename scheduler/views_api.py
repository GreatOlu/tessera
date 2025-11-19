from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from datetime import time

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

PREFERRED_TIME_WINDOWS = {
    "morning":  (8 * 60, 12 * 60),   # 08:00–12:00
    "afternoon": (12 * 60, 16 * 60), # 12:00–16:00
    "evening":  (16 * 60, 20 * 60),  # 16:00–20:00
}

def time_to_minutes(t):
    """Convert a datetime.time to minutes after midnight."""
    if t is None:
        return None
    return t.hour * 60 + t.minute

def get_section_days(section):
    """
    Normalize days from the model into a list like ['M','W'].
    Works whether days is a list (MultiSelect) or 'M,W' string.
    """
    d = section.days
    if isinstance(d, (list, tuple)):
        return list(d)
    if d is None:
        return []
    return [x.strip() for x in str(d).split(",") if x.strip()]

def passes_hard_preferences(combo, total_credits, prefs):
    """
    Apply hard constraints:
    - earliest_start: no class before this time
    - avoid_days: no classes on these days
    - max_classes_per_day: do not exceed this per day
    """
    earliest_start_str = prefs.get("earliest_start") or None
    avoid_days = prefs.get("avoid_days") or []
    max_classes_per_day = prefs.get("max_classes_per_day") or None

    # Convert start limit to minutes (or None if no preference)
    earliest_start_min = None
    if earliest_start_str:
        try:
            h, m = earliest_start_str.split(":")
            earliest_start_min = int(h) * 60 + int(m)
        except ValueError:
            pass

    # 1) Check earliest_start
    if earliest_start_min is not None:
        for sec in combo:
            sec_start = time_to_minutes(sec.start_time)
            if sec_start is not None and sec_start < earliest_start_min:
                return False

    # 2) Check avoid_days
    avoid_set = set(avoid_days)
    if avoid_set:
        for sec in combo:
            if avoid_set.intersection(get_section_days(sec)):
                return False

    # 3) Check max_classes_per_day
    if max_classes_per_day:
        try:
            max_per_day = int(max_classes_per_day)
        except ValueError:
            max_per_day = None
        if max_per_day:
            day_counts = {}
            for sec in combo:
                for d in get_section_days(sec):
                    day_counts[d] = day_counts.get(d, 0) + 1
            if any(count > max_per_day for count in day_counts.values()):
                return False

    # You already enforce 12–18 credits earlier in your logic.
    return True

def score_schedule(combo, prefs):
    """
    Compute a score based on soft preferences.
    Currently:
    - preferred_time: morning / afternoon / evening
      Reward sections whose mid-time lies in that window.
    """
    preferred_time = prefs.get("preferred_time") or None
    if not preferred_time or preferred_time not in PREFERRED_TIME_WINDOWS:
        return 0  # no soft preferences → neutral score

    start_win, end_win = PREFERRED_TIME_WINDOWS[preferred_time]
    score = 0

    for sec in combo:
        start_min = time_to_minutes(sec.start_time)
        end_min = time_to_minutes(sec.end_time)
        if start_min is None or end_min is None:
            continue
        mid = (start_min + end_min) // 2
        if start_win <= mid <= end_win:
            score += 3  # reward sections aligned with preference

    return score


@api_view(['POST'])
def generate_schedules_api(request):
    selected_ids = request.data.get('selected_courses', [])
    prefs = request.data.get('preferences', {}) or {}

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

            # no time conflicts (your existing helper)
            if any(has_conflict(a, b) for i, a in enumerate(combo) for b in combo[i+1:]):
                continue

            total_credits = sum(s.course.credits for s in combo)

            # full-time only
            if not (12 <= total_credits <= 18):
                continue

            # apply hard prefs: earliest_start, avoid_days, max_classes_per_day
            if not passes_hard_preferences(combo, total_credits, prefs):
                continue

            # compute soft score
            score = score_schedule(combo, prefs)

            valid_schedules.append({
                "sections": CourseSectionReadSerializer(combo, many=True).data,
                "total_credits": total_credits,
                "score": score,
            })

    if not valid_schedules:
        # no schedule found that matches constraints
        return Response(None)  # frontend will treat as "no schedule"

    # pick the highest scoring schedule
    best = max(valid_schedules, key=lambda s: s.get("score", 0))
    # optionally hide score from client if you want:
    # best.pop("score", None)

    return Response(best)