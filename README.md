## Kaszint – Salon Assistant Ecosystem

This repository contains two main projects:

- **`chatbot(py)`**: A Python‑based multi‑salon Telegram chatbot with AI‑driven booking logic and Google Calendar integration.
- **`express react`**: A full web platform (React frontend + Express/Node backend) with salon registration, guest‑facing flows and an admin dashboard.

Below is a short overview; you can find detailed documentation in each project’s own README.

---

## Project structure overview

- **`chatbot(py)/`**
  - **`backend/`**: database, calendar and shared logic
  - **`chatbot/`**: Telegram bot entry point, AI modules, message handlers
- **`express react/`**
  - **`server/`**: Express REST API, authentication, bookings, file uploads, email, AI
  - **`client/`**: React single‑page app (auth, dashboard, UI components)

---

## Quick start – development environment

### Prerequisites

- **Node.js** LTS (recommended ≥ 18)
- **npm** or **yarn**
- **Python 3.10+**
- Available **MySQL/MariaDB** server

### 1. Backend + frontend (web app)

See details in `express react/README.md`. In short:

1. **Backend** (`express react/server`):
   - `cd "express react/server"`
   - `npm install`
   - configure `.env` (database, email, JWT, etc.)
   - initialize database: `npm run setup:db` (and/or migrations)
   - start in dev mode: `npm run dev`
2. **Frontend** (`express react/client`):
   - `cd "express react/client"`
   - `npm install`
   - `npm start` → open `http://localhost:3000`

### 2. Telegram chatbot(s)

See details in `chatbot(py)/README.md`. In short:

1. **Install dependencies**:
   - `cd "chatbot(py)"`
   - `pip install -r requirements.txt`
2. **Configuration**:
   - set up Telegram bot tokens, Google Calendar IDs, database connection
   - update Google service account JSON path if needed
3. **Start the bot**:
   - `python -m chatbot.main` or `python chatbot/main.py`

---

## Where to find detailed docs?

- **Python Telegram chatbot**: `chatbot(py)/README.md`
- **Express/Node backend + React client**: `express react/README.md`

These contain detailed examples for `.env` variables, run commands and core features.

