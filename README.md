# CivicPulse AI - Admin Dashboard

This update adds a simple admin dashboard so officials can view, filter, assign, and resolve citizen complaints.

New files:
- admin.html - lightweight admin interface to list complaints and act on them
- admin.js - client script for the admin UI
- Updated server.js - added database columns (status, department, priority) and endpoints:
  - GET /api/complaints - list complaints
  - POST /api/complaints/:id/assign - assign a department
  - POST /api/complaints/:id/status - update status (open, in-progress, resolved, escalated)
  - GET /admin - serves the admin UI

How to run locally:
1. npm install
2. node server.js
3. Visit http://localhost:3000/admin to access the admin dashboard

Notes:
- This is a demo admin UI without authentication. Do NOT expose it publicly without adding access controls.
- For production, add authentication, pagination, search indexes, and role-based permissions.
