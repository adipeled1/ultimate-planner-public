from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_loader import load_raw_data, get_course_metadata
from filters import filter_courses
from algorithm import ScheduleOptimizer

app = FastAPI()

IS_VERCEL = os.environ.get("VERCEL") == "1"

if IS_VERCEL:
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://ultimate-planner-web.vercel.app")
    allowed_origins = [FRONTEND_URL]
else:
    allowed_origins = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/courses")
def get_courses():
    raw_data = load_raw_data()
    courses_list = []
    seen_ids = set()

    for c in raw_data:
        c_id = c.get("course_id")
        if c_id and c_id not in seen_ids:
            courses_list.append({"id": c_id, "name": c.get("course_name")})
            seen_ids.add(c_id)

    courses_list.sort(key=lambda x: x["name"])
    metadata_map = get_course_metadata()

    return {"courses": courses_list, "metadata": metadata_map}


@app.post("/api/generate")
def generate_schedule(data: dict):
    selected_course_ids = data.get("selected_courses", [])
    blocked_time_slots = data.get("blocked_time_slots", [])
    preferred_lecturers = data.get("preferred_lecturers", {})
    unwanted_specific_groups = data.get("unwanted_specific_groups", [])

    if not selected_course_ids:
        return JSONResponse(
            status_code=400,
            content={"error": "No courses selected."}
        )

    filtered_courses = filter_courses(
        selected_course_ids,
        blocked_time_slots,
        preferred_lecturers,
        unwanted_specific_groups,
    )

    # Check whether the applied constraints left any valid options for every component
    for course in filtered_courses:
        empty_components = [c for c in course.components if not c.options]
        if empty_components:
            comp_names = ", ".join(c.component_type for c in empty_components)
            return {
                "status": "impossible",
                "message": (
                    f"No valid groups remain for '{course.name}' "
                    f"({comp_names}) after applying your constraints. "
                    f"Try removing some blocks."
                ),
            }

    # Flatten components for the solver
    all_components = [
        component
        for course in filtered_courses
        for component in course.components
    ]

    optimizer = ScheduleOptimizer()
    schedules = optimizer.solve(all_components)

    if not schedules:
        return {
            "status": "impossible",
            "message": (
                "No conflict-free schedule exists for the selected courses "
                "under the current constraints. Try removing some blocks or "
                "selecting fewer courses."
            ),
        }

    results_json = []
    for sched in schedules[:20]:
        schedule_data = [
            {
                "id": group.id,
                "course_id": group.course_id,
                "course_name": group.course_name,
                "component_type": group.component_type,
                "teacher": group.teacher,
                "slots": [
                    {
                        "day": s.day.name,
                        "start": s.start_time,
                        "end": s.end_time,
                        "location": s.location,
                    }
                    for s in group.time_slots
                ],
            }
            for group in sched
        ]
        results_json.append(schedule_data)

    return {
        "status": "success",
        "count": len(results_json),
        "schedules": results_json,
    }


if __name__ == "__main__":
    import uvicorn
    print("Server running on http://127.0.0.1:8000")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
