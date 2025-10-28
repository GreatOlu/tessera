from django.shortcuts import render
from .models import Course
from .models import CourseSection

def course_list(request):
    courses = Course.objects.all()
    return render(request, "course_list.html", {"courses": courses})


def section_list(request):
    sections = CourseSection.objects.select_related('course')
    return render(request, "section_list.html", {"sections": sections})