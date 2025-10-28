from django.shortcuts import render, redirect
from django.http import HttpResponse
from django import forms
from .models import Course
from .models import CourseSection
from .utils import has_conflict
import itertools

def course_list(request):
    courses = Course.objects.all()
    return render(request, "course_list.html", {"courses": courses})


def section_list(request):
    sections = CourseSection.objects.select_related('course')
    return render(request, "section_list.html", {"sections": sections})


class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['code', 'title']


def add_course(request):
    if request.method == 'POST':
        form = CourseForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('course_list')
    else:
        form = CourseForm()
    return render(request, 'add_course.html', {'form': form})


def check_conflict_demo(request):
    """
    Compare all CourseSections in the database and list any conflicting pairs.
    """
    sections = list(CourseSection.objects.all())

    if len(sections) < 2:
        return HttpResponse("Not enough sections to compare.")

    conflicts = []

    # Compare every pair of sections (A vs B)
    for i in range(len(sections)):
        for j in range(i + 1, len(sections)):
            s1, s2 = sections[i], sections[j]
            if has_conflict(s1, s2):
                conflicts.append((s1, s2))

    if not conflicts:
        return HttpResponse("No conflicts detected among current sections.")

    # Build a readable output
    message = "<h2>Conflicting Sections Detected:</h2><ul>"
    for s1, s2 in conflicts:
        message += f"<li>{s1} conflicts with {s2}</li>"
    message += "</ul>"

    return HttpResponse(message)


def generate_schedules(request):
    """
    Generate all valid non-conflicting schedules that include
    between 12 and 18 total credits.
    """
    sections = list(CourseSection.objects.select_related('course'))

    if not sections:
        return HttpResponse("No sections available in the database.")

    valid_combinations = []

    for r in range(2, min(6, len(sections) + 1)):
        for combo in itertools.combinations(sections, r):
            # Avoid duplicate courses in the same schedule
            course_ids = [s.course.id for s in combo]
            if len(course_ids) != len(set(course_ids)):
                continue

            # Check for time conflicts
            conflict_found = False
            for i in range(len(combo)):
                for j in range(i + 1, len(combo)):
                    if has_conflict(combo[i], combo[j]):
                        conflict_found = True
                        break
                if conflict_found:
                    break

            if conflict_found:
                continue

            # Calculate total credits
            total_credits = sum(s.course.credits for s in combo)

            # Filter schedules by credit range (12–18)
            if 12 <= total_credits <= 18:
                valid_combinations.append((combo, total_credits))

    if not valid_combinations:
        return HttpResponse("No valid schedules found within 12–18 credits.")

    # Display valid schedules with their total credits
    message = "<h2>✅ Valid Schedules (12–18 credits):</h2>"
    for combo, credits in valid_combinations:
        message += f"<p><strong>Total Credits: {credits}</strong></p><ul>"
        for s in combo:
            message += f"<li>{s} ({s.course.credits} credits)</li>"
        message += "</ul>"

    return HttpResponse(message)