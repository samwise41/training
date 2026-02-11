# **Coaching Prompt**

I have a training plan location in this github location. Can you review this file thoroughly, **specifically cross-referencing the following sources

https://raw.githubusercontent.com/samwise41/training/main/Weekly_Coaching_Prompt.md

https://raw.githubusercontent.com/samwise41/training/main/endurance_plan.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/adherence.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/coaching_view.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/garmin_health.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/profile.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/readiness.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/trends.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/recipes.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/training_log.md

https://raw.githubusercontent.com/samwise41/training/main/notebook_lm/phases.md

Please generate my training for the next week? 

Please generate a raw markdown text of next week's schedule. Please provide evidence that you followed the Weekly Generator Checklist SOP. If I forget to attach the GitHub repo, please remind me before spinning your wheels. 

**ADAPTIVE LOGIC INSTRUCTIONS:**
1. **Analyze (Trends):** Read `coaching_view.md` first. Identify any metrics flagged with "⚠️ Low" or "⚠️ High", or those showing "Improving" or "Declining" trends that may require attention. Read `garmin_health.md` first. Identify any trends in the wrong direction that may require attention.
2. **Analyze (History):** Review the "Actual Workout" column in `training_log.md`. Check when the last workout labeled "Zwift Race" occurred. 
3.  **Progression & Scaling Rules:** Review the progression scaling rules and make sure that all rules are incorporated. If a rule is violated, please explain why you chose to violate that rule. Make sure to review the phases.md source and determine the microcyle we are in. 
4.  **Inventory Check (Zwift Library):**
   - **Trigger:** Before prescribing a custom/manual bike workout description.
   - **Action:** specificially review the `.zwo` files in the `zwift_library/` folder.
   - **Matching Logic:** Parse the XML to find a workout that matches the specific duration and physiological focus (e.g., "Low Cadence" or "Sweet Spot").
   - **Priority:** If a suitable file exists, prescribe it by name (e.g., "Do [BIKE] 'Hill Grinder.zwo'"). The file is suitable if it very closely matches the desired function and duration of the workout. If not, write a new custom description. You do not need to force a new workout into an old custom Zwift workout. 
5. **Diagnose & Prescribe:** You are the coach. Alter the standard microcycle based on the following rules:
   - **The "Fun Factor" Rule:** If I have not done a "Zwift Race" in the past 2 weeks, you MUST substitute one of the high-intensity bike sessions (Threshold or Sweet Spot) with a `[BIKE] Zwift Race`.
   - **Weakness Targeting:** For every flagged metric in the Briefing, alter the drills to fix it. Do not just copy the standard template though.
      - *Example:* If **Torque Efficiency** is low, design the "Strength" ride to specifically focus on force production (choose appropriate drills like low-cadence intervals, hill repeats, or stomps based on the current training phase).
      - *Example:* If **Ground Contact Time** is high, insert specific neuromuscular drills (e.g., high cadence spins or striders) into the aerobic runs.
      - *Requirement:* Use drills that are scientifically known to address the specific weak metric.
6. **Report:** In your response, explicitly list the weaknesses/history you identified and explain *why* you chose the specific drills (or Zwift Race) to fix them.

**CRITICAL FORMATTING RULES:**
6. Return the schedule **ONLY** as a raw text Markdown table.
7. You **MUST** use these exact column headers: `| Status | Day | Planned Workout | Planned Duration | Actual Workout | Actual Duration | Notes / Targets | Date |`
8. Do **NOT** change the header names or order, or the dashboard parser will break.
9. Dates must be in `YYYY-MM-DD` format.
10. Do not include Strength/Yoga/Stretching in this table; only Run/Bike/Swim.
11. "Status" should be "PLANNED" for all future workouts.
12. **Naming Convention:** Use the specific keywords defined in Section 9 (Taxonomy) when naming workouts (e.g., use "Strength Intervals" instead of just "Intervals") to ensure they are tracked by the dashboard.
13. **Notes Column:** In the "Notes / Targets" column, explicitly mention the specific focus or drill prescribed (e.g., "Focus: Zwift Race for mental variety and VO2 Max stimulus").

GitHub Training Plan Files:
- Plan: https://github.com/samwise41/training-plan/blob/main/endurance_plan.md
- History: https://github.com/samwise41/training-plan/blob/main/data/training_log.md
