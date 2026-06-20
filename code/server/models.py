from enum import Enum
from typing import List


class Day(Enum):
    SUNDAY = 0
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6


class TimeSlot:
    def __init__(self, day: str, start_time: int, end_time: int, location: str = ""):
        if isinstance(day, str):
            try:
                self.day = Day[day.upper()]
            except KeyError:
                raise ValueError(f"Invalid day: {day}")
        else:
            self.day = day

        self.start_time = start_time
        self.end_time = end_time
        self.location = location

    def overlaps(self, other: "TimeSlot") -> bool:
        if self.day != other.day:
            return False
        return max(self.start_time, other.start_time) < min(self.end_time, other.end_time)

    def __repr__(self):
        return f"{self.day.name[:3]} {self.start_time}-{self.end_time}"


class Group:
    def __init__(
        self,
        id: str,
        course_id: str,
        course_name: str,
        component_type: str,
        teacher: str,
        time_slots: List[TimeSlot],
    ):
        self.id = id
        self.course_id = course_id
        self.course_name = course_name
        self.component_type = component_type
        self.teacher = teacher
        self.time_slots = time_slots

    def __repr__(self):
        return f"Group(id={self.id}, course={self.course_name}, type={self.component_type})"


# Alias used throughout the codebase
CourseGroup = Group


class CourseComponent:
    def __init__(self, component_type: str, options: List[Group] = None):
        self.component_type = component_type  # e.g. "Lecture", "Practice", "Lab"
        self.options = options if options else []
        self.course_id = ""
        self.course_name = ""

    def add_group(self, group: Group):
        self.options.append(group)


class Course:
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name
        self.components: List[CourseComponent] = []

    def add_component(self, component: CourseComponent):
        component.course_id = self.id
        component.course_name = self.name
        self.components.append(component)
