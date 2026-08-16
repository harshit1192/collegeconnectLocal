# CollegeConnect

A private social networking and academic support platform for verified college students — combining a social feed, academic Q&A, study resource sharing, clubs/communities, events, real-time messaging, notifications, and an admin dashboard in one app.

**Status: All 14 build phases complete.**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [MongoDB Setup](#mongodb-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [How to Run](#how-to-run)
- [Seed Data](#seed-data)
- [Admin Setup](#admin-setup)
- [API Overview](#api-overview)
- [Git / GitHub Workflow](#git--github-workflow)
- [Implementation Notes by Phase](#implementation-notes-by-phase)
- [Known Limitations](#known-limitations)

---

## Features

- **Authentication** — college-email-only registration, email verification (console-logged in dev), JWT login, forgot/reset password, protected routes, role-based access (student/admin).
- **Student Profiles** — bio, skills, interests, achievements, GitHub/LinkedIn, profile picture upload, follow/unfollow, searchable student directory.
- **Social Feed** — create/edit/delete posts with images, like/unlike, comment, report.
- **Academic Q&A** — ask/answer questions by subject, upvote/downvote, accept an answer, comment on answers, search/filter.
- **Notes & Resources** — upload/download study material with strict file-type validation, search/filter by subject/semester/branch/type.
- **Clubs & Communities** — create/join/leave communities, per-community feed, member management, promote admins.
- **Events & Announcements** — college-wide or community-scoped events with registration/capacity limits, platform-wide announcement banner.
- **Real-Time Messaging** — one-to-one chat via Socket.IO, online/offline status, typing indicators, read receipts.
- **Notifications** — real-time bell dropdown + full history, triggered by likes, comments, follows, answers, accepted answers, messages, and community announcements.
- **Admin Dashboard** — user management (verify/block/unblock/delete), reports/moderation queue, dashboard stats.
- **Global Search** — one search box across students, posts, questions, resources, communities, and events.

## Tech Stack

**Frontend:** React 18 + Vite, Tailwind CSS, React Router, Axios, Socket.IO client, React Hot Toast
**Backend:** Node.js, Express.js, JWT auth, bcryptjs, Multer, Socket.IO, Helmet, express-rate-limit
**Database:** MongoDB + Mongoose

## Folder Structure

```
collegeconnect/
├── client/                        # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js             # dev proxy for /api and /uploads → backend
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx / App.jsx     # routing + provider setup
│       ├── context/                # AuthContext, SocketContext
│       ├── layouts/                # MainLayout, AdminLayout
│       ├── components/             # PostCard, Feed, Navbar, ChatWindow, ...
│       ├── pages/                  # one file per route, incl. pages/admin/
│       └── services/               # one file per API resource (axios calls)
│
├── server/                        # Express backend
│   ├── server.js                  # app entry point (Express + http + Socket.IO)
│   ├── seed.js                    # demo data seed script
│   ├── config/                    # db.js (Mongoose), socket.js (Socket.IO)
│   ├── models/                    # one Mongoose schema per collection
│   ├── controllers/               # business logic, one file per resource
│   ├── routes/                    # one Express router per resource
│   ├── middleware/                # auth, error handling, file upload
│   ├── utils/                     # JWT signing, dev email stub
│   └── uploads/                   # profile-pictures/, posts/, resources/, events/
│
├── .env.example
├── .gitignore
└── README.md
```

## Installation

Prerequisites: **Node.js 18+**, **npm**, and a **MongoDB** instance (local or Atlas — see [MongoDB Setup](#mongodb-setup)).

```bash
git clone <your-repo-url> collegeconnect
cd collegeconnect
```

## Environment Variables

Copy `.env.example` to `server/.env` and fill in real values:

```bash
cp .env.example server/.env
```

| Variable         | Description                                              | Example                                         |
|------------------|------------------------------------------------------------|--------------------------------------------------|
| `MONGO_URI`      | MongoDB connection string                                  | `mongodb://127.0.0.1:27017/collegeconnect`      |
| `JWT_SECRET`     | Long random secret used to sign JWTs                       | (generate your own, don't reuse the example)    |
| `JWT_EXPIRES_IN` | JWT lifetime                                                | `7d`                                             |
| `PORT`           | Backend port                                                | `5000`                                           |
| `NODE_ENV`       | `development` or `production`                              | `development`                                    |
| `CLIENT_URL`     | Frontend origin, used for CORS and generated email links   | `http://localhost:5173`                          |

Never commit the real `server/.env` file — it's already covered by `.gitignore`.

## MongoDB Setup

Pick one:

- **Local:** install MongoDB Community Server and run it (`mongod`); default connection string `mongodb://127.0.0.1:27017`.
- **MongoDB Atlas (cloud, free tier):** create a cluster, add a database user, whitelist your IP (or `0.0.0.0/0` for local dev), then copy the connection string it gives you.

```
MONGO_URI=mongodb://127.0.0.1:27017/collegeconnect
# or, for Atlas:
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/collegeconnect
```

## Backend Setup

```bash
cd server
npm install
npm run dev
```

This starts the Express API **and** Socket.IO on the same port (`http://localhost:5000` by default). If `MONGO_URI` is missing or unreachable, the server logs an error and exits — start MongoDB first.

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

Starts the Vite dev server at `http://localhost:5173`, with `/api` and `/uploads` requests proxied to the backend (see `client/vite.config.js`) so you don't need to hardcode a backend host or fight CORS during development.

## How to Run

1. Start MongoDB.
2. In one terminal: `cd server && npm run dev`.
3. In another terminal: `cd client && npm run dev`.
4. (Optional but recommended) Seed demo data: `cd server && npm run seed`.
5. Open `http://localhost:5173`, register a new account (or log in with a seeded demo account — see below), and verify your email via the link printed in the **backend terminal**.

## Seed Data

A seed script populates the database with demo students, posts, a Q&A thread, a community, an event, and resource metadata — useful for demos without manually registering a dozen accounts.

```bash
cd server
npm run seed
```

⚠️ **This clears the `users`, `posts`, `questions`, `answers`, `resources`, `communities`, and `events` collections first.** Only run it against a local/dev database.

**Demo credentials created by the seed script** (for local development only):

| Role    | Email             | Password       |
|---------|-------------------|----------------|
| Admin   | `admin@test.edu`  | `Admin@123`    |
| Student | `aisha@test.edu`  | `Student@123`  |
| Student | `rohan@test.edu`  | `Student@123`  |
| Student | `priya@test.edu`  | `Student@123`  |
| Student | `karan@test.edu`  | `Student@123`  |
| Student | `sneha@test.edu`  | `Student@123`  |

All seeded accounts are pre-verified, so you can log in immediately without checking the console for a verification link.

## Admin Setup

The seed script above already creates an admin (`admin@test.edu` / `Admin@123`). To promote a different account to admin manually (no admin signup form exists, by design):

```js
// in mongosh, connected to your collegeconnect database
db.users.updateOne({ email: "you@test.edu" }, { $set: { role: "admin" } })
```

Log out and back in afterward so the new role is reflected in your session. Admins get an **Admin** link in the navbar leading to `/admin` (dashboard stats), `/admin/users`, and `/admin/reports`.

## API Overview

All endpoints are prefixed with `/api` and (except registration/login/health) require `Authorization: Bearer <token>`.

| Resource | Base path | Key endpoints |
|---|---|---|
| Auth | `/api/auth` | `register`, `login`, `logout`, `me`, `verify-email/:token`, `forgot-password`, `reset-password/:token` |
| Users | `/api/users` | `GET /`, `GET /:id`, `PUT /profile`, `POST /profile/picture`, `POST /:id/follow`, `POST /:id/unfollow`, `POST /:id/report` |
| Posts | `/api/posts` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/like`, `POST /:id/comments`, `POST /:id/report` |
| Questions | `/api/questions` | `GET /`, `POST /`, `POST /:id/vote`, `POST /:id/answers`, `POST /:id/answers/:answerId/accept` |
| Resources | `/api/resources` | `GET /`, `POST /`, `GET /:id/download`, `DELETE /:id` |
| Communities | `/api/communities` | `GET /`, `POST /`, `POST /:id/join`, `POST /:id/leave`, `GET /:id/posts` |
| Events | `/api/events` | `GET /?when=upcoming\|past`, `POST /`, `POST /:id/register` |
| Announcements | `/api/announcements` | `GET /?community=`, `POST /` |
| Conversations | `/api/conversations` | `GET /`, `POST /`, `GET /:id/messages`, `POST /:id/messages` |
| Notifications | `/api/notifications` | `GET /`, `PUT /:id/read`, `PUT /read-all` |
| Admin | `/api/admin` | `GET /stats`, `GET /users`, `PUT /users/:id/block`, `GET /reports`, `PUT /reports/:id` |
| Search | `/api/search` | `GET /?q=` |

Every response follows `{ success: boolean, ...data }` on success or `{ success: false, message }` on error (see `server/middleware/errorMiddleware.js`).

## Git / GitHub Workflow

```bash
git init
git add .
git commit -m "Initial commit: CollegeConnect full-stack app"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Suggested branch workflow for further development: feature branches off `main` (`git checkout -b feature/xyz`), commit in small logical chunks, open a PR back into `main`. `.gitignore` already excludes `node_modules/`, `.env`, and `server/uploads/*` (except a `.gitkeep` placeholder) so build artifacts and secrets never get committed.

---

## Implementation Notes by Phase

<details>
<summary><strong>Phase 13 — Search & Moderation</strong></summary>

- `GET /api/search?q=` runs a case-insensitive regex search in parallel across Users, Posts, Questions, Resources, Communities, and Events, capped at 5 results per category — a quick cross-platform lookup, not a replacement for each section's own filtered list page.
- The navbar search box shows a live dropdown preview as you type; pressing Enter (or "See all results") goes to the full `/search?q=` results page.
- Reporting is complete for every content type the spec calls out: posts, resources, comments, and users all write to the same `Report` collection and show up in the admin Reports queue under the correct `targetType`.
- The comment/user report reason picker uses a plain `window.prompt()` rather than a styled dropdown (unlike the post/resource report UI) — functionally equivalent, but a styled modal would be a nice polish item.
</details>

<details>
<summary><strong>Phase 12 — Admin Dashboard</strong></summary>

- All `/api/admin/*` routes require both a valid JWT **and** `role: 'admin'` (`router.use(protect, authorize('admin'))` in `adminRoutes.js`). The frontend also gates `/admin/*` routes via `<ProtectedRoute roles={['admin']}>`, but the real enforcement is server-side.
- Community/event/announcement management don't have separate `/api/admin/...` endpoints — admins already get full CRUD access through the regular controllers from Phases 8–9 (they bypass ownership/community-admin checks). The admin dashboard UI focuses on users, reports, and stats.
- Deleting a user does **not** cascade-delete their posts/comments/questions — a straightforward account removal to keep scope manageable; a production system would likely soft-delete or anonymize instead.
</details>

<details>
<summary><strong>Phase 11 — Notifications</strong></summary>

- `notificationController.js` exports a shared `createNotification`/`createNotifications` helper other controllers call whenever something notification-worthy happens (like, comment, follow, answer, accepted answer, message, community announcement).
- A notification is written to MongoDB first, then pushed live over Socket.IO (`new-notification` event) if the recipient is online.
- Event reminders (`event_reminder` type exists in the schema) aren't scheduled yet — that needs a recurring job (e.g. `node-cron`), a natural next step once deployed somewhere that can run a background scheduler.
- Platform-wide announcements are **not** mass-notified to every student (avoids a large fan-out write) — surfaced via the Home banner instead; community-scoped announcements do notify all members.
</details>

<details>
<summary><strong>Phase 10 — Real-Time Messaging</strong></summary>

- Express is wrapped in a raw `http.Server` so Socket.IO shares the same port — no separate WebSocket port.
- Socket connections authenticate with the same JWT used for REST calls, sent via `socket.handshake.auth.token`.
- Messages persist to MongoDB first, then emit to the recipient's socket if online — nothing is lost if they're offline.
- Online status is tracked in-memory, fine for a single-server deployment; multi-instance production would need a shared store like Redis.
- Conversations are strictly one-to-one; no group chat.
</details>

<details>
<summary><strong>Phase 9 — Events & Announcements</strong></summary>

- Events/announcements can be college-wide (`community: null`, platform admins only) or community-scoped (creatable by that community's creator/admins, or a platform admin).
- Event registration is blocked once the date has passed or `maxParticipants` is reached (blank = unlimited).
- The Home page shows a dismissible banner of platform-wide announcements; community-scoped announcements aren't surfaced in the community page UI yet, though the API supports `GET /api/announcements?community=<id>`.
</details>

<details>
<summary><strong>Phase 8 — Communities</strong></summary>

- `Post` gained an optional `community` field. The main feed (`GET /api/posts`) only shows posts with `community: null`; community posts live under `GET /api/communities/:id/posts`, and you must be a member to post there.
- The creator is automatically a member+admin and can't leave (only regular members can) — they'd delete the community instead (no ownership-transfer UI).
- Community admins can remove members; only the creator (or a platform admin) can promote a member to admin.
</details>

<details>
<summary><strong>Phase 7 — Resources</strong></summary>

- File uploads are restricted to a strict allowlist checked on **both** MIME type and file extension — executables, scripts, and HTML are rejected outright. Max size 15MB.
- Files are stored with randomized filenames; the original filename is preserved separately in the DB for display on download.
- Downloading increments a `downloads` counter server-side.
</details>

<details>
<summary><strong>Phase 6 — Academic Q&A</strong></summary>

- Subjects are a fixed enum — edit `SUBJECTS` in `server/models/Question.js` (and mirror in `questionService.js`) to add more.
- Voting is a toggle (same direction again removes it, opposite direction switches it), identical logic for questions and answers.
- Only the question's author can accept an answer; accepting a new one automatically un-accepts the previous.
- Comments on answers are simple embedded subdocuments (add-only), not a full separate collection.
</details>

<details>
<summary><strong>Phase 5 — Social Feed</strong></summary>

- Post images upload via Multer (max 4 per post, 3MB each, JPEG/PNG/WEBP only).
- Comments are a separate collection referenced from `Post.comments`.
- Reporting posts writes to the shared `Report` collection, later extended to comments/users/resources (Phase 13) and reviewed by admins (Phase 12).
- The feed uses page-based "Load more" pagination rather than infinite scroll, for simplicity.
</details>

<details>
<summary><strong>Phase 4 — Profiles & Networking</strong></summary>

- Profile pictures upload via Multer (JPEG/PNG/WEBP, max 3MB) to `server/uploads/profile-pictures/`.
- Follow/unfollow is modeled as `followers`/`following` arrays directly on `User` — simple and fast at college scale; a dedicated `Follow` collection would be worth it at much larger scale.
- Student search supports name/roll/skills text search plus branch/year/section filters.
</details>

<details>
<summary><strong>Phase 3 — Authentication</strong></summary>

- Registration only accepts college email domains — edit `ALLOWED_EMAIL_DOMAINS` in `authController.js` (defaults include `college.edu`, `university.edu`, `test.edu` for testing).
- Email verification and password-reset links are logged to the **server console** instead of actually emailed (`server/utils/sendEmail.js`) — swap in a real provider (Nodemailer, SendGrid) for production; the function signature stays the same.
- Passwords are bcrypt-hashed and never returned by the API. JWTs are stored in `localStorage` on the frontend and attached automatically to future requests.
</details>

---

## Known Limitations

These are intentional scope trade-offs for a college-project-sized build, called out here rather than hidden:

- **No automated test suite.** Verification throughout the build was done via `node --check` (syntax) and manual endpoint/flow walkthroughs described in each phase. Adding Jest/Supertest coverage for controllers and React Testing Library coverage for components would be the natural next step.
- **Emails are console-logged, not sent.** Verification and password-reset links print to the backend terminal in dev; wire in a real provider (Nodemailer + SMTP, SendGrid, etc.) before any real deployment.
- **No event-reminder scheduler.** The notification type exists, but nothing triggers it yet — needs a recurring job (e.g. `node-cron`).
- **In-memory online-user tracking.** Fine for one server process; a multi-instance deployment needs a shared store (Redis) for Socket.IO presence.
- **No image/file CDN or thumbnailing.** Uploaded files are served directly by Express from local disk — fine for a demo, but a production deployment would want object storage (S3, etc.) and a CDN in front of it.
- **Deleting a user doesn't cascade.** Their historical posts/comments/etc. remain with a dangling author reference rather than being deleted or reassigned.
- **Global search is regex-based**, not a dedicated search engine (e.g. Atlas Search/Elasticsearch) — fine at this scale, would need revisiting for a much larger dataset.
