from django.shortcuts import render, redirect
from .models import Course
from .models import CourseSection
from django import forms

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