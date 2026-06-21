# Ultimate Planner 📅 🚀

**The over-engineered solution to a simple problem.**

Ultimate Planner is a full-stack application designed to generate the mathematically optimal semester schedule. Why use a pen and paper when you can use a constraint satisfaction algorithm running on a dedicated cloud backend?

## 🧐 Why?
As Software Engineering students, we face a choice:
1. Spend 30 minutes manually arranging courses in Excel.
2. Spend weeks building a scalable, serverless client-server architecture with an ETL data pipeline to do it for us.

We chose option 2.

## ⚡ Features
* **Conflict Detection:** Mathematically guarantees zero overlaps.
* **Optimization Heuristics:** Doesn't just find *a* schedule; it finds the best one based on your constraints (specifically minimizing the number of study days and minimizing window hours/gaps between classes).
* **"Industry Standard" Structure:** Built with separation of concerns, modern frameworks, and serverless deployment in mind—because maintainability matters even for a semester project.

## 🧩 The Scheduling Algorithm (CSP)
At the heart of Ultimate Planner is an optimized Constraint Satisfaction Problem (CSP) solver. Rather than blindly generating all possible schedule permutations and then sorting them (which would be highly inefficient), the algorithm dynamically prunes the search space:

1. **Early Filtering & Pruning:** The solver integrates user constraints (such as preferred days off) directly into the search process. It immediately discards partial schedules and combinations that fail constraints or stand no chance of being optimal, avoiding wasted computation.
2. **Solving:** The algorithm constructs permutations only from the remaining viable options that survived the early pruning stages.
3. **Scoring & Sorting:** The final valid schedules are evaluated and sorted based on optimization heuristics (minimizing weekly days on campus and gaps between classes) to present you with the best results.

## 🛠 Architecture
This isn't just a script; it's a platform. The codebase is organized as follows:

* **Frontend (`code/client/`):** A modern, interactive React web interface that allows users to select courses, view schedule permutations, and visualize their week.
* **Backend (`code/server/`):** A FastAPI serverless application hosting the core optimization engine. It uses a custom algorithm to solve the scheduling Constraint Satisfaction Problem (CSP) while keeping the data secure.
* **Data Pipeline (`code/data-pipe/` — Not Public Yet):** An automated Python ETL process that scrapes, parses, and sanitizes raw HTML course catalogs into structured JSON datasets consumed by the backend. It uses the Python library **Beautiful Soup** to extract and structure the data. *(Note: The data pipeline code is currently private and not included in this repository).*

## 🌐 Live Version & Hosting
* **Upcoming Release:** In September, the planner will be officially hosted and populated with the courses of the new semester.
* **Announcements:** The direct link to the application will be posted here and shared on LinkedIn once it is live.

## 🌍 Customization for Other Universities and Colleges
Ultimate Planner is a generic tool. Although it is preloaded with Braude's Software Engineering courses, any student can clone this repository, replace `courses.json` under `server/data/` with their own, and use it for their university or college.