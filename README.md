# IdealTask — Task Management System

A full-stack team task management platform built with **Vue 3**, **Node.js/Express**, and **PostgreSQL**.

🌐 **Live Demo:** [https://task-management-system-nu-brown.vercel.app](https://task-management-system-nu-brown.vercel.app)

---

## Features

### Authentication
- Email & password registration and login
- **Sign in with Google** (OAuth 2.0)
- Password reset via email link
- **Member invitation system** — admins send an invite link by email; the member sets their own name and password when accepting
- JWT-based authentication with 1-hour token expiry

### Task Management
- **Kanban board** — drag and drop tasks between Todo, In Progress, and Done columns
- Create, edit, duplicate, and delete tasks
- Task **priority levels** — Low, Medium, High
- Task **due dates** with date/time picker
- **Overdue detection** — overdue tasks are highlighted in red
- **Big tasks** — tasks with a checklist of subtasks
- File **attachments** — upload up to 5 files per task
- **Comments** on tasks with **@mention** support (mentioned users receive a notification)
- Task **activity log** — every change is recorded with timestamp and actor
- **Export to CSV** — download the current filtered task list
- **Task templates** — save a task as a reusable template and apply it when creating new tasks

### Projects
- Create and manage multiple projects
- Assign team members to projects
- **Project progress bar** — shows percentage of tasks completed per project
- Members can join projects to access their tasks

### Team & Members
- **Admin and Member roles** with separate permissions
- Admin can create, edit, and delete members
- **Invite members by email** — professional HTML email with accept link
- Members only see and update tasks assigned to them

### Notifications
- In-app notification bell with unread count badge
- Real-time task assignment notifications
- **Email notifications** when a task is assigned to you
- @mention notifications in comments
- Due date reminders — notified 24 hours and 1 hour before deadline
- Mark individual or all notifications as read

### Dashboard & Analytics
- KPI cards — total tasks, completed, average completion time, project count
- Status distribution chart (Chart.js)
- Tasks per project bar chart
- 7-day throughput chart (created vs completed)
- Team productivity table — per-member task stats (admin only)
- Project completion chart (admin only)

### Profile & Settings
- **Profile picture upload** — avatar shown in the sidebar
- Update username and email
- Change password
- **Dark mode** toggle — also follows system preference automatically
- Email & SMTP configuration for personal outbox
- Audit log — full history of all task changes (admin only)

### AI Chat Assistant
- Floating chat widget powered by **Groq AI**
- Ask questions about your tasks, workload, and deadlines
- Suggestion chips for quick queries
- Typing indicator and conversation history
- Clear chat button
- Full dark mode support

### Deployment & Infrastructure
- Frontend deployed on **Vercel** with SPA routing
- Backend deployed on **Render** (Node.js)
- PostgreSQL database on **Render**
- CORS configured for all origins
- Rate limiting on authentication endpoints
- Static file serving for uploads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Tailwind CSS, Chart.js |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Auth | JWT, Google OAuth 2.0 |
| AI | Groq SDK |
| Email | Nodemailer (Gmail SMTP) |
| File uploads | Multer |
| Deployment | Vercel (frontend), Render (backend + DB) |

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL

### Backend
```bash
cd backend
npm install
# Windows PowerShell: Copy-Item .env.example .env
# macOS/Linux: cp .env.example .env
# Fill DB_NAME and DB_PASSWORD, check DB_USER, and set a unique JWT_SECRET.
node src/server.js
```

For local PostgreSQL, use `DB_HOST=localhost` with an existing database and set `DB_PORT` to the port shown in pgAdmin (`5432` is only the default). The backend always loads `backend/.env`, regardless of the terminal's working directory. The HTTP port defaults to 5000. Startup reports missing settings before attempting a database connection, and the HTTP server starts only after database initialization succeeds. SMTP and Google sign-in settings are optional for those features.

### Frontend
```bash
cd frontend/task-manager
npm install
# create .env with VITE_API_URL and VITE_GOOGLE_CLIENT_ID
npm run dev
```

The frontend reads its backend address from `VITE_API_URL` (see `frontend/task-manager/.env.example`). In development it defaults to `http://localhost:5000`; production without this setting uses the same origin. API requests, attachments, and profile images all use this address.

### Maintenance checks
Run `npm test` in both `backend` and `frontend/task-manager`, then run `npm run build` in the frontend. The tests use mock database responses and offline email composition; they do not create users or send messages. Public registration creates members only. Existing administrators keep their role, and authenticated requests check the current database role.

With the local backend running, `npm run test:workflow` in `backend` runs the API workflow against your local PostgreSQL database. It creates isolated QA users and projects, exercises registration, invitations, password reset, assignment, attachments, comments, notifications, checklists, completion, duplication, templates, and access restrictions, then removes its fixtures. Results are saved to `backend/test-results/workflow.json`. The runner refuses hosted databases, production mode, and configured live SMTP; external email delivery, Google OAuth, and Groq calls require separate integration checks.

---

## Environment Variables

### Backend `.env`
```
PORT=5000
JWT_SECRET=your_secret
DATABASE_URL=postgresql://...        # Render PostgreSQL URL
FRONTEND_URL=https://your-vercel-app.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=Your Name <you@gmail.com>
GROQ_API_KEY=your_groq_api_key
```

### Frontend `.env`
```
VITE_API_URL=https://your-render-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
