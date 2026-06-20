from typing import Dict, List
from models import Course, CourseComponent, Group, TimeSlot
from data_loader import load_raw_data

DAY_ORDER = {
    "SUNDAY": 0, "MONDAY": 1, "TUESDAY": 2,
    "WEDNESDAY": 3, "THURSDAY": 4, "FRIDAY": 5, "SATURDAY": 6,
}


def is_time_blocked(slot: Dict, blocked_time_slots: List[Dict]) -> bool:
    """Return True if slot overlaps with any of the user's blocked time ranges."""
    for block in blocked_time_slots:
        if block["day"] == slot["day"]:
            if slot["start"] < block["end"] and slot["end"] > block["start"]:
                return True
    return False


def is_group_specifically_blocked(
    c_id: str,
    comp_type: str,
    raw_slots: List[Dict],
    unwanted_specific_groups: List[Dict],
) -> bool:
    """
    Return True if this group matches one of the user's specific block entries.

    A group is identified by: course_id + component_type + day + start_time
    of its earliest time slot (sorted by day then start time).
    """
    if not raw_slots or not unwanted_specific_groups:
        return False

    sorted_slots = sorted(
        raw_slots, key=lambda s: (DAY_ORDER.get(s["day"], 99), s["start"])
    )
    first_slot = sorted_slots[0]

    for block in unwanted_specific_groups:
        if (
            block["course_id"] == c_id
            and block["component_type"] == comp_type
            and block["day"] == first_slot["day"]
            and block["start_time"] == first_slot["start"]
        ):
            return True

    return False


def filter_courses(
    selected_course_ids: List[str],
    blocked_time_slots: List[Dict],
    preferred_lecturers: Dict[str, List[str]],
    unwanted_specific_groups: List[Dict],
) -> List[Course]:
    """
    Load raw course data and apply all user constraints, returning a list of
    Course objects whose components contain only the groups that remain valid.

    Filters applied (in order):
      1. Specific group blocks  — user explicitly excluded this group
      2. Lecturer preferences   — user only wants certain teachers
      3. Blocked time slots     — group overlaps with a blocked day/window
    """
    raw_data = load_raw_data()
    courses_map: Dict[str, Course] = {}

    for course_data in raw_data:
        c_id = course_data.get("course_id")
        c_name = course_data.get("course_name")

        if c_id not in selected_course_ids:
            continue

        if c_id not in courses_map:
            courses_map[c_id] = Course(c_id, c_name)

        course_obj = courses_map[c_id]
        component_type = course_data.get("component_type", "Unknown")
        component_obj = CourseComponent(component_type)

        for option in course_data.get("options", []):
            g_id = option.get("group_id")
            teacher = option.get("teacher")
            raw_slots = option.get("time_slots", [])

            # Filter 1: specific group block
            if is_group_specifically_blocked(c_id, component_type, raw_slots, unwanted_specific_groups):
                continue

            # Filter 2: lecturer preference
            course_prefs = preferred_lecturers.get(c_id, [])
            if course_prefs and teacher not in course_prefs:
                continue

            # Filter 3: blocked time slots
            model_slots = []
            blocked = False
            for s in raw_slots:
                if is_time_blocked(s, blocked_time_slots):
                    blocked = True
                    break
                model_slots.append(TimeSlot(s["day"], s["start"], s["end"], s.get("location", "")))

            if blocked:
                continue

            component_obj.add_group(
                Group(
                    id=g_id,
                    course_id=c_id,
                    course_name=c_name,
                    component_type=component_type,
                    teacher=teacher,
                    time_slots=model_slots,
                )
            )

        course_obj.add_component(component_obj)

    return list(courses_map.values())
