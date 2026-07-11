# Orbital Feature Spec #002

## Title
Dashboard Layout Refactor & Graph Statistics

---

## Goal

Refactor the current MVP into a modular React application using reusable components.

App.tsx should become a composition file that imports reusable components rather than containing all dashboard code.

---

## Objectives

- Improve project organization.
- Improve readability.
- Prepare the application for future features.
- Keep all current functionality.
- Add dashboard statistics using Recharts.

---

## Current Problems

- App.tsx is too large.
- Layout is difficult to modify.
- Components are not reusable.
- Dashboard statistics are missing.

---

## Layout

Dashboard should contain:

Sidebar
Header
Dashboard Grid
Statistics Cards
Graph Section
AI Assistant Panel

Desktop:
Sidebar | Main Dashboard | AI Panel

Tablet:
Sidebar collapses.

Mobile:
Vertical layout.

---

## Components

Create these folders if they don't exist.

src/
    components/
        layout/
            Sidebar.tsx
            Header.tsx
            DashboardLayout.tsx

        cards/
            StatCard.tsx
            TaskSummaryCard.tsx
            GoalProgressCard.tsx
            VehicleStatusCard.tsx

        charts/
            WeeklyProgressChart.tsx
            TaskBreakdownChart.tsx
            VehicleHealthChart.tsx

        assistant/
            AIAssistantPanel.tsx

---

## Data

Create

src/data/mockDashboardData.ts

Mock:

- weekly productivity
- completed tasks
- goals
- vehicle battery
- fuel economy
- engine temperature

---

## Charts

Use Recharts.

Charts:

- Weekly productivity
- Task completion
- Vehicle statistics

---

## App.tsx

Responsibilities:

Import components.

Compose dashboard.

No business logic.

---

## Rules

Do NOT

- Rewrite entire project.
- Remove existing features.
- Change existing state unless required.
- Change colors unless necessary.
- Rename unrelated files.

Do

- Create reusable components.
- Keep code beginner-readable.
- Use TypeScript.
- Keep Tailwind classes organized.

---

## Acceptance Criteria

- App.tsx under ~100 lines.
- Components reusable.
- Dashboard responsive.
- Recharts working.
- npm run build passes.