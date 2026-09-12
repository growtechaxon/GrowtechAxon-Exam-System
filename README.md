# GrowtechAxon Exam System

A multi-test examination platform with:
- Multiple/future tests from Admin
- Server-side scoring
- Timer + automatic submission
- MongoDB result storage
- Candidate sees no score after submission
- WhatsApp group CTA after submission
- Separate certificate portal
- Public certificate verification
- Result PDF
- Premium certificate PDF
- Admin result search and certificate editing
- Certificate revoke/restore
- Admin test creation/editing/deletion

## Run locally

1. Install Node.js (LTS recommended).
2. Open this folder in VS Code.
3. Run:
   npm install
4. Copy `.env.example` to `.env`.
5. Put your MongoDB connection string in `MONGODB_URI`.
6. Set a strong `JWT_SECRET`, admin email and password.
7. Run:
   npm start
8. Open:
   http://localhost:5000

Default admin:
- URL: http://localhost:5000/admin/login.html
- Email/password are whatever you set in `.env`.

The first server start automatically creates a demo:
HTML & CSS Assessment — 20 questions — 15 minutes.

## Render deployment

Build Command:
npm install

Start Command:
npm start

Add all `.env` values as Render Environment Variables. Set `PUBLIC_BASE_URL` to your Render service URL.

## Important WhatsApp limitation

The "Open WhatsApp" button prepares a message, but normal WhatsApp Web/browser links cannot programmatically attach a PDF file. The admin downloads the PDF and attaches it in WhatsApp. Fully automatic PDF sending requires an approved WhatsApp Business Cloud API integration and credentials.

## Certificate

Certificates are generated only for passed results when the test has certificateEnabled=true. The candidate verifies Certificate ID + email in the Certificate Portal. Public verification can be done with Certificate ID only.

For a real public deployment, keep the admin password strong, rotate JWT_SECRET, use HTTPS, and consider rate limiting/CAPTCHA.

## GrowtechAxon contact/branding used
- Email: growtechaxon@gmail.com
- WhatsApp: +91 9219226570
- GitHub: https://github.com/growtechaxon
- LinkedIn: https://www.linkedin.com/in/growtech-axon-2b7a30435/
- YouTube: https://youtube.com/@growtechaxon
- Instagram: https://www.instagram.com/growtechaxon/
- Facebook: https://www.facebook.com/profile.php?id=61593886546973

## Certificate workflow
A passed candidate receives a unique certificate ID in the database. The candidate uses that ID + their exam email in `certificate.html` to verify and download the PDF. `verify.html` allows public verification by certificate ID. Admin can edit the certificate record (including status/revocation) without changing the original exam score.
