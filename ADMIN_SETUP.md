# Admin Dashboard Setup

## Install Required Packages

Run these commands in the frontend directory:

```bash
cd frontend
npm install chart.js react-chartjs-2 date-fns
```

## Packages Installed:
- `chart.js` - Core charting library
- `react-chartjs-2` - React wrapper for Chart.js
- `date-fns` - Date manipulation and formatting

## Features:
1. Sidebar navigation
2. Analytics dashboard with charts (Pie, Line, Bar)
3. Total bookings (Today/Week/Month)
4. Revenue tracking
5. Cancelled and completed bookings
6. Average rating summary
7. User management (CRUD)
8. Service management (CRUD)
9. Payment tracking
10. Review management

## Role System:
- Role 1: Admin (manually added to database)
- Role 2: Organizer (creates services)
- Role 3: User (books services)
