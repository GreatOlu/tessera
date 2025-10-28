from django.shortcuts import render, redirect
from django.http import HttpResponse
from django import forms
from .models import Course
from .models import CourseSection
from .utils import has_conflict

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
    sections = CourseSection.objects.all()[:2]  # take first two sections for demo
    if len(sections) < 2:
        return HttpResponse("Not enough sections to compare.")
    
    s1, s2 = sections[0], sections[1]
    conflict = has_conflict(s1, s2)
    message = f"Comparing {s1} and {s2}: {'Conflict detected!' if conflict else 'No conflict.'}"
    return HttpResponse(message)