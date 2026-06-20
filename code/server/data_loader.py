import os
import json
from typing import Dict, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "courses.json")


def load_raw_data() -> List[Dict]:
    """Load raw course data from the JSON file produced by the data-pipe."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []


def get_course_metadata() -> Dict[str, Dict]:
    """
    Return a dict keyed by course_id with metadata used by the frontend:
      - lecturers      : sorted list of teacher names
      - component_types: sorted list of component types (Lecture, Practice, ...)
    """
    raw_data = load_raw_data()
    metadata: Dict[str, Dict] = {}

    for course in raw_data:
        c_id = course.get("course_id")
        if not c_id:
            continue

        if c_id not in metadata:
            metadata[c_id] = {"lecturers": set(), "component_types": set()}

        comp_type = course.get("component_type")
        if comp_type:
            metadata[c_id]["component_types"].add(comp_type)

        for option in course.get("options", []):
            teacher = option.get("teacher")
            if teacher and teacher != "Unknown":
                metadata[c_id]["lecturers"].add(teacher)

    return {
        cid: {
            "lecturers": sorted(data["lecturers"]),
            "component_types": sorted(data["component_types"]),
        }
        for cid, data in metadata.items()
    }
