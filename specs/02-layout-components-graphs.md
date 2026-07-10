# Orbital Layout, Components, and Graph Statistics Spec

## Goal
Refactor the Orbital MVP so the app has a clean dashboard layout, reusable components connected through App.tsx, and graph/statistics cards using mock data.

## Main Layout
- App.tsx should act as the main composition file.
- App.tsx should import and render major components.
- The UI should have:
  - Sidebar navigation
  - Top header/status bar
  - Main dashboard grid
  - Right-side AI assistant panel if screen size allows
- Layout should be responsive.

## Components
Create or organize components into:
- components/layout/Sidebar.tsx
- components/layout/Header.tsx
- components/layout/DashboardLayout.tsx
- components/cards/StatCard.tsx
- components/cards/VehicleStatusCard.tsx
- components/cards/TaskSummaryCard.tsx
- components/cards/GoalProgressCard.tsx
- components/charts/WeeklyProgressChart.tsx
- components/charts/TaskBreakdownChart.tsx
- components/assistant/AIAssistantPanel.tsx

## Graph Statistics
Use mock data for now.

Charts should show:
- Weekly productivity progress
- Task completion breakdown
- Vehicle health/status statistics

Use Recharts if installed. If not installed, install it.

## Rules
- Do not remove existing features.
- Do not change business logic unless necessary.
- Keep components beginner-readable.
- Use TypeScript types for props.
- Use Tailwind CSS for styling.
- Keep mock data in a separate file if possible:
  - src/data/mockDashboardData.ts

## Acceptance Criteria
- App.tsx is clean and mainly imports components.
- Dashboard renders without errors.
- Layout is responsive.
- Graph/stat cards display mock data.
- Code builds with npm run build.