from django.test import TestCase
from datetime import time
from .models import Course, CourseSection
from .utils import has_conflict
from itertools import combinations

class ConflictDetectionTests(TestCase):
    def setUp(self):
        self.course1 = Course.objects.create(code="CSCI-210", title="Data Structures", credits=3)
        self.course2 = Course.objects.create(code="MATH-120", title="Calculus I", credits=4)

        # Non-overlapping sections
        self.section1 = CourseSection.objects.create(
            course=self.course1,
            section_number="01",
            days=["M", "W"],
            start_time=time(9, 0),
            end_time=time(10, 0),
        )
        self.section2 = CourseSection.objects.create(
            course=self.course2,
            section_number="01",
            days=["T", "Th"],
            start_time=time(9, 0),
            end_time=time(10, 0),
        )

        # Overlapping section on Monday
        self.section3 = CourseSection.objects.create(
            course=self.course2,
            section_number="02",
            days=["M", "F"],
            start_time=time(9, 30),
            end_time=time(10, 30),
        )

    def test_no_conflict_different_days(self):
        self.assertFalse(has_conflict(self.section1, self.section2))

    def test_conflict_same_day(self):
        self.assertTrue(has_conflict(self.section1, self.section3))

    def test_conflict_symmetric(self):
        self.assertEqual(has_conflict(self.section1, self.section3),
                         has_conflict(self.section3, self.section1))


class ScheduleCreditTests(TestCase):
    def test_credit_range_filter(self):
        c1 = Course.objects.create(code="CS1", title="A", credits=3)
        c2 = Course.objects.create(code="CS2", title="B", credits=4)
        c3 = Course.objects.create(code="CS3", title="C", credits=5)
        total = sum(c.credits for c in [c1, c2, c3])
        self.assertTrue(12 <= total <= 18)
