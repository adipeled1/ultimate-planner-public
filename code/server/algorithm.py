"""
Schedule Optimizer — CSP Solver
================================
This is the heart of the Ultimate Planner backend.

The problem is a Constraint Satisfaction Problem (CSP):
  - Variables   : each course component (e.g. "Calculus / Lecture")
  - Domains     : the available group options for that component
  - Constraints : no two assigned groups may overlap in time

We solve it with:
  1. Backtracking          — the standard recursive CSP engine
  2. Forward Checking (FC) — after every assignment, prune conflicting
                             options from the domains of future variables;
                             abort the branch immediately when any domain
                             becomes empty (dead-end detection)
  3. Dynamic MRV           — at every recursive level, pick the next
                             variable with the Minimum Remaining Values
                             in its current (post-FC) domain, so the
                             most constrained component is tackled first
  4. Day-count pruning     — terminate branches that already exceed the
                             best solution's number of active school days

Scoring (lower is better):
  Primary   — minimize the number of active school days
  Secondary — minimize total idle-gap minutes between classes on the
              same day (with a fairness correction for the lunch break)
"""

from typing import Dict, List, Tuple
from models import CourseComponent, CourseGroup, TimeSlot, Day


class ScheduleOptimizer:
    """
    Finds all optimal schedules given a list of filtered CourseComponents.
    Call solve() once per request; the object resets itself each time.
    """

    def __init__(self):
        self.best_schedules: List[List[CourseGroup]] = []
        # Score tuple: (num_days, gap_minutes). Initialized to a guaranteed-worse value.
        self.best_score: Tuple[int, int] = (8, float('inf'))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def solve(self, requirements: List[CourseComponent]) -> List[List[CourseGroup]]:
        """
        Entry point.  Receives a list of CourseComponents that have already
        been filtered by the user's constraints (blocked days, blocked
        groups, preferred lecturers).

        Returns up to 20 optimal schedules (all schedules that share the
        same best score), or an empty list if no valid schedule exists.
        """
        # Reset state for this request
        self.best_schedules = []
        self.best_score = (8, float('inf'))

        # ── Early exit: if any component has zero options, solving is pointless ──
        for req in requirements:
            if not req.options:
                print(
                    f"[Solver] Cannot solve: '{req.course_name}' "
                    f"({req.component_type}) has no valid options after filtering."
                )
                return []

        # ── Build initial domains ──
        # domains[i] = list of valid GroupOption objects for requirements[i].
        # We work with indices so Dynamic MRV can freely reorder without
        # disturbing the original requirements list.
        n = len(requirements)
        initial_domains: Dict[int, List[CourseGroup]] = {
            i: list(requirements[i].options) for i in range(n)
        }
        unassigned = list(range(n))

        # ── Launch recursive search ──
        self._backtrack(requirements, unassigned, [], initial_domains)

        return self.best_schedules

    # ------------------------------------------------------------------
    # Core recursive engine
    # ------------------------------------------------------------------

    def _backtrack(
        self,
        requirements: List[CourseComponent],
        unassigned: List[int],
        current_schedule: List[CourseGroup],
        domains: Dict[int, List[CourseGroup]],
    ) -> None:
        """
        Recursive backtracking with Forward Checking and Dynamic MRV.

        Parameters
        ----------
        requirements      : full list of components (read-only reference)
        unassigned        : indices of components not yet assigned
        current_schedule  : groups assigned so far (mutated + restored as a stack)
        domains           : mapping index → list of currently valid options;
                            shrinks via Forward Checking but is never mutated
                            in place — each level receives its own copy
        """

        # ── BASE CASE: all components assigned ──
        if not unassigned:
            score = self._calculate_score(current_schedule)
            if score < self.best_score:
                # New best — replace the saved list
                self.best_score = score
                self.best_schedules = [list(current_schedule)]
            elif score == self.best_score:
                # Tied for best — keep all equally good solutions (up to 20)
                if len(self.best_schedules) < 20:
                    self.best_schedules.append(list(current_schedule))
            return

        # ── PRUNING: day-count bound ──
        # If the partial schedule already uses more days than the best
        # complete solution we found so far, this branch can only get worse.
        if self.best_schedules:
            if self._count_days(current_schedule) > self.best_score[0]:
                return

        # ── DYNAMIC MRV: choose the most-constrained remaining variable ──
        #
        # Unlike static MRV (sort once before the search), Dynamic MRV
        # re-evaluates domain sizes at every level.  After Forward Checking
        # has pruned conflicting options from future domains, those sizes
        # now reflect the *current* search state — not the original counts.
        # This means we always tackle the tightest bottleneck next, which
        # dramatically reduces the search tree.
        chosen = min(unassigned, key=lambda i: len(domains[i]))
        remaining = [i for i in unassigned if i != chosen]

        # ── Try every value in the chosen variable's current domain ──
        for group_option in domains[chosen]:
            #
            # WHY no _has_conflict check here?
            # Forward Checking guarantees that every option remaining in
            # domains[chosen] is already conflict-free with every group in
            # current_schedule.  The check would always pass, so it is
            # intentionally omitted for efficiency.
            #
            current_schedule.append(group_option)

            # ── FORWARD CHECKING ──
            # Propagate the assignment: remove from each remaining variable's
            # domain any option that would conflict with group_option.
            # If any domain collapses to empty, we have a dead end and skip
            # this branch entirely without recursing.
            new_domains, dead_end = self._forward_check(
                group_option, remaining, domains
            )

            if not dead_end:
                self._backtrack(requirements, remaining, current_schedule, new_domains)
            # If dead_end == True we simply skip the recursive call.
            # The branch is already provably unsolvable, so no work is wasted.

            current_schedule.pop()  # Undo assignment (backtrack)

    # ------------------------------------------------------------------
    # Forward Checking helper
    # ------------------------------------------------------------------

    def _forward_check(
        self,
        assigned_group: CourseGroup,
        remaining_indices: List[int],
        domains: Dict[int, List[CourseGroup]],
    ) -> Tuple[Dict[int, List[CourseGroup]], bool]:
        """
        After assigning assigned_group, filter out any option in each
        remaining variable's domain that would conflict with it.

        Returns
        -------
        new_domains : updated domain dict (shallow copy; only changed entries
                      are replaced so unchanged domains are shared by reference)
        dead_end    : True if any remaining variable's domain became empty,
                      meaning this assignment leads to an unsolvable state
        """
        # Shallow-copy the dict so the caller's domains are not mutated.
        # Individual domain lists are only replaced when options are removed.
        new_domains = dict(domains)

        for i in remaining_indices:
            # Keep only options that do NOT conflict with the new assignment
            filtered = [
                opt for opt in domains[i]
                if not self._groups_conflict(opt, assigned_group)
            ]

            # ── Domain wipeout — dead end ──
            if not filtered:
                return new_domains, True

            # Only store a new list when something was actually pruned
            if len(filtered) < len(domains[i]):
                new_domains[i] = filtered

        return new_domains, False

    # ------------------------------------------------------------------
    # Conflict detection
    # ------------------------------------------------------------------

    def _groups_conflict(self, group_a: CourseGroup, group_b: CourseGroup) -> bool:
        """
        Return True if group_a and group_b have any overlapping time slot.
        Delegates the actual overlap check to TimeSlot.overlaps().
        """
        for slot_a in group_a.time_slots:
            for slot_b in group_b.time_slots:
                if slot_a.overlaps(slot_b):
                    return True
        return False

    def _has_conflict(
        self, candidate: CourseGroup, schedule: List[CourseGroup]
    ) -> bool:
        """
        Return True if candidate conflicts with any group already in schedule.
        (Kept for use in unit tests or future extensions; not called during
        the main search because Forward Checking makes it redundant there.)
        """
        for existing in schedule:
            if self._groups_conflict(candidate, existing):
                return True
        return False

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def _calculate_score(
        self, schedule: List[CourseGroup]
    ) -> Tuple[int, int]:
        """
        Compute a 2-tuple score for a complete schedule.  Lower is better.

        Score = (number_of_active_days, total_gap_minutes)

        number_of_active_days
            How many distinct weekdays have at least one class.
            Minimizing this gives the student more full days off.

        total_gap_minutes
            Sum of idle time between consecutive classes on the same day.
            Minimizing this makes each study day more compact.

        Lunch-break fairness correction
            If the schedule wraps around 12:20–12:50 but that window is
            genuinely free (no class starts or ends inside it), we subtract
            30 minutes from the gap score for that day.  A free lunch break
            is not wasted time — penalizing it would unfairly rank schedules
            with a natural lunch gap below schedules without one.
        """
        all_slots = [slot for group in schedule for slot in group.time_slots]
        if not all_slots:
            return (0, 0)

        active_days = {slot.day for slot in all_slots}
        num_days = len(active_days)
        total_gap_minutes = 0

        # Lunch break window (minutes from midnight)
        BREAK_START = 740  # 12:20
        BREAK_END = 770    # 12:50

        # Group slots by day for gap calculation
        slots_by_day: Dict[Day, List[TimeSlot]] = {day: [] for day in active_days}
        for slot in all_slots:
            slots_by_day[slot.day].append(slot)

        for day, day_slots in slots_by_day.items():
            if len(day_slots) <= 1:
                continue  # No gaps possible with a single class

            day_slots.sort(key=lambda s: s.start_time)

            # Accumulate gaps between consecutive classes
            for i in range(len(day_slots) - 1):
                gap = day_slots[i + 1].start_time - day_slots[i].end_time
                if gap > 0:
                    total_gap_minutes += gap

            # Lunch fairness correction:
            # Does this day span across the lunch window, and is that window free?
            first_start = day_slots[0].start_time
            last_end = day_slots[-1].end_time

            day_spans_lunch = first_start < BREAK_END and last_end > BREAK_START
            if day_spans_lunch:
                lunch_is_free = all(
                    not (s.start_time < BREAK_END and BREAK_START < s.end_time)
                    for s in day_slots
                )
                if lunch_is_free:
                    total_gap_minutes = max(0, total_gap_minutes - 30)

        return (num_days, total_gap_minutes)

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------

    def _count_days(self, schedule: List[CourseGroup]) -> int:
        """Count distinct days used in a partial (or complete) schedule."""
        return len(
            {slot.day for group in schedule for slot in group.time_slots}
        )
