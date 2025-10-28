from django.db import models
from multiselectfield import MultiSelectField

class Student(models.Model):
    name = models.CharField(max_length=100)
    major = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name


class Course(models.Model):
    code = models.CharField(max_length=20)  # e.g., CSCI-210
    title = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.code} - {self.title}"


class CourseSection(models.Model):
    DAYS = [
        ('M', 'Monday'),
        ('T', 'Tuesday'),
        ('W', 'Wednesday'),
        ('Th', 'Thursday'),
        ('F', 'Friday'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sections")
    section_number = models.CharField(max_length=10)
    instructor = models.CharField(max_length=100, blank=True)
    days = MultiSelectField(choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.course.code}-{self.section_number}"


class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    section = models.ForeignKey(CourseSection, on_delete=models.CASCADE)
    semester = models.CharField(max_length=20)
    year = models.IntegerField()

    def __str__(self):
        return f"{self.student.name} -> {self.section}"




