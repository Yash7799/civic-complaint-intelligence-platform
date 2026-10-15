# CivicPulse AI

This repository contains a demo front-end and a simple Node/Express backend to accept civic complaints with images and location data.

## What I added

- A complaint submission form on the public site (index.html) with fields: name, contact (email/phone), title, description, address, latitude/longitude, images (multiple).
- Client-side JS to preview images, use browser geolocation, and submit the form to the backend.
- Backend (server.js) using Express + Multer + SQLite to store complaints and uploaded images.
- Static file serving so you can run the app locally and submit complaints.

## Run locally

1. Clone the repo and open in VS Code.
2. Install Node.js (v16+ recommended).
3. From the project root run:

```bash
npm install
node server.js
```

4. Open your browser to `http://localhost:3000`.

5. The API endpoints:
- POST /api/complaints (multipart/form-data) – submit a complaint. Field names: name, email, title, description, address, lat, lng, images (multiple)
- GET /api/complaints – list recent complaints (JSON)

Files uploaded are stored in `/uploads` and the SQLite database is at `/data/complaints.db`.

## Notes
- This is a demo; for production you should add authentication, input validation, rate-limiting, virus scanning for uploads, HTTPS, and cloud storage for images.
