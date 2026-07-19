# Orbital Feature Spec #002

# Title

Dashboard Layout Refactor, Statistics & Mobile Experience

---

# Goal

Refactor the current Orbital MVP into a modular React application using reusable components.

App.tsx should primarily compose reusable components rather than containing dashboard implementation details.

This feature establishes the foundation for the Orbital Dashboard across:

- Desktop
- Tablet
- Mobile
- Future Car Display

---

# Objectives

- Improve project organization
- Improve readability
- Improve maintainability
- Prepare the application for future features
- Add dashboard statistics using Recharts
- Improve the mobile experience
- Keep all existing functionality

---

# Current Problems

- App.tsx is too large.
- Layout is difficult to modify.
- Components are not reusable.
- Dashboard statistics are missing.
- Mobile view becomes compressed and difficult to use.
- Desktop layout does not translate well to smaller screens.

---

# Layout

## Desktop

Layout:

Sidebar | Dashboard | AI Assistant

The desktop experience should display the complete dashboard.

---

## Tablet

- Sidebar may collapse or become narrower.
- Dashboard cards should resize appropriately.
- Charts remain visible.
- AI Assistant remains accessible.

---

## Mobile

Do NOT compress the desktop dashboard into one long page.

Instead, provide a mobile-first navigation experience using two primary views:

- Overview
- Agenda

---

# Components

Organize components into reusable folders.

```
src/

components/

    layout/
        Sidebar.tsx
        Header.tsx
        DashboardLayout.tsx

    navigation/
        MobileNavigation.tsx

    views/
        OverviewView.tsx
        AgendaView.tsx

    cards/
        StatCard.tsx
        TaskSummaryCard.tsx
        GoalProgressCard.tsx
        VehicleStatusCard.tsx
        MonthlyGoalCard.tsx
        HotStreakCard.tsx

    charts/
        WeeklyProgressChart.tsx
        TaskBreakdownChart.tsx
        VehicleHealthChart.tsx

    assistant/
        AIAssistantPanel.tsx
```

---

# Data

Create

```
src/data/mockDashboardData.ts
```

Store all mock dashboard information here.

Examples:

- Weekly productivity
- Tasks
- Goals
- Monthly goal progress
- Hot streak
- Vehicle battery
- Fuel economy
- Engine temperature
- Vehicle health
- Dashboard statistics

Components should consume data from this file rather than containing hardcoded values.

---

# Charts

Use Recharts.

Charts should include:

- Weekly Productivity
- Task Completion Breakdown
- Vehicle Health Statistics

Charts must use data imported from:

```
src/data/mockDashboardData.ts
```

Charts should use:

- ResponsiveContainer
- Responsive sizing
- Reusable components

---

# Mobile Navigation

## Purpose

The mobile application should prioritize usability rather than attempting to display the entire desktop dashboard.

Instead of shrinking every card onto one screen, mobile users should switch between focused views.

---

## Overview

Purpose:

Provide a quick summary of Orbital and the vehicle.

Display:

- Vehicle diagnostics
- Vehicle status
- Vehicle statistics
- Important alerts
- AI-generated daily summary
- AI-generated vehicle summary
- AI assistant
- AI question input

Overview should become the default screen for:

- Mobile
- Future Car Display

---

## Agenda

Purpose:

Provide productivity information.

Display:

- Task Tracker
- Monthly Goal
- Hot Streak
- Goal Progress
- Weekly Productivity
- Task Completion Statistics

Agenda belongs to:

- Desktop Dashboard
- Mobile Dashboard

Agenda is NOT the primary vehicle driving screen.

---

## Navigation Behavior

On Mobile:

Create two tabs:

- Overview
- Agenda

Requirements:

- Overview selected by default
- Switching tabs should not reload the application
- Only the active view should render
- Touch-friendly navigation
- Large buttons
- No horizontal scrolling
- Preserve existing functionality

Desktop and Tablet should continue using the existing dashboard layout.

---

# App.tsx

Responsibilities:

- Compose application components
- Import layout components
- Render dashboard views
- Render responsive layouts
- Keep feature-specific logic outside App.tsx whenever possible

Simple UI state (such as the active mobile tab) may remain inside App.tsx if appropriate.

If App.tsx grows too large, move that state into DashboardLayout or MobileNavigation.

---

# Rules

## Do NOT

- Rewrite the entire project
- Remove existing functionality
- Break current features
- Rename unrelated files
- Change colors unless necessary
- Change business logic unless required

---

## Do

- Create reusable React components
- Keep TypeScript beginner-readable
- Organize Tailwind classes
- Separate UI from mock data
- Reuse components wherever possible
- Follow existing project structure
- Make responsive behavior predictable

---

# Constraints

- Preserve current dashboard functionality.
- Use React + TypeScript.
- Use Tailwind CSS.
- Use Recharts.
- Do not introduce React Router unless already installed.
- Minimize unnecessary file changes.
- Prefer the smallest reasonable implementation.

---

# Future Considerations

This architecture should support future Orbital features including:

- Real OBD-II vehicle data
- Voice Assistant
- AI Planning
- Calendar Integration
- Music Controls
- Maps & Navigation
- Camera System
- Notifications
- IoT Devices
- Local AI
- Car Display Mode

The current implementation should use mock data but remain easy to replace with live data later.

---

# Acceptance Criteria

- App.tsx remains approximately 100 lines or fewer.
- Components are reusable.
- Dashboard cards are modular.
- Charts use Recharts.
- Charts consume centralized mock data.
- Desktop dashboard remains unchanged.
- Tablet layout remains responsive.
- Mobile shows Overview by default.
- Mobile uses Overview and Agenda tabs.
- Only one mobile view is visible at a time.
- Mobile contains no horizontal overflow at 375px width.
- Charts remain readable on mobile.
- Touch targets are easy to use.
- Wide landscape displays work correctly.
- Future car display defaults to Overview.
- Existing features continue to function.
- npm run build passes successfully.