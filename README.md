# CivicPulse AI

This repository contains a demo front-end and a simple Node/Express backend to accept civic complaints with images and location data.

## Authentication for Admin

A basic admin authentication flow has been added so that only authorized users can access the admin dashboard and modify complaint records.

On first run the server will create a default admin user stored at `data/admin.json`:

- username: admin
- password: admin123

You MUST change this password before deploying or edit the `data/admin.json` file.

## Run locally

1. Clone the repo and open in VS Code.
2. Install Node.js (v16+ recommended).
3. From the project root run:

```bash
npm install
node server.js
```

4. Open your browser to:

- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin-login.html
- Admin dashboard (after login): http://localhost:3000/admin

API endpoints:
- POST /api/complaints (multipart/form-data) – submit a complaint. Field names: name, email, title, description, address, lat, lng, images (multiple)
- GET /api/complaints – list recent complaints (JSON)
- POST /api/complaints/:id/assign – assign a department (requires admin session)
- POST /api/complaints/:id/status – update status (requires admin session)

Files uploaded are stored in `/uploads` and the SQLite database is at `/data/complaints.db`.

## Security notes
- This is a demo. Replace the default admin credentials and keep `data/admin.json` secure.
- Add HTTPS and environment-based secrets in production. Consider using a proper identity provider for admin access.
