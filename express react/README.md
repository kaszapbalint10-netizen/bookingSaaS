## Express + React – Salon Web Platform

This folder contains the **web interface**:

- **Backend**: `server/` – Express/Node.js REST API
- **Frontend**: `client/` – React SPA (Create React App)

The goal is a complete **salon management system**:

- Salon registration and authentication
- Guest‑facing pages and booking flows
- Dashboard with statistics, calendar, settings
- AI‑powered assistant (Google Gemini) and media management

---

## Directory structure

- **`server/`**
  - `index.js`, `server.js`: start the Node/Express application.
  - `src/app.js`: Express app configuration (CORS, routes, static files, error handling).
  - `src/routes/`: REST endpoints (auth, bookings, dashboard, guest, salons, assets, health).
  - `src/controllers/`: business logic (auth, assets, etc.).
  - `src/services/`: service layer (auth, email, AI, image processing, storage).
  - `src/security/`: crypto and token logic (JWT, password hashing).
  - `src/utils/`: helpers (NLU, reply building, pricing, workflow).
  - `config/`: assistant configurations (prompts, data, images).
  - `uploads/`: uploaded files (logos, profile images, favicons, etc.).
- **`client/`**
  - `src/App.js`, `src/index.js`: React entry points.
  - `src/components/`:
    - `Auth/`: login, registration, password reset, email verification.
    - `Dashboard/`: dashboard views, sections, stats and reusable UI.
    - `SalonBrowser/`: salon browsing / guest views.
    - `UI/`: modern UI components (Button, Input, Modal, Toast, Skeleton, etc.).
    - `CarAssistant/`, `AssistantSelector/`, `GuestRegistration/`: special flows and assistants.
  - `public/`: static assets (backgrounds, icons).
  - `styles/`: global and accessibility CSS (e.g. CSS variables, responsive layout).

---

## Prerequisites

- **Node.js** LTS (recommended ≥ 18)
- **npm** (or Yarn)
- **MySQL/MariaDB** database
- External services:
  - SMTP server (for emails – registration/verification, etc.)
  - Google Gemini API key (optional, for AI features)

---

## Backend (`server/`) – Setup and run

### 1. Install dependencies

```bash
cd "express react/server"
npm install
```

From `package.json`, the backend uses among others:

- `express`, `cors`
- `mysql2` – DB connection
- `jsonwebtoken`, `argon2` / `bcrypt` – auth and password handling
- `multer`, `sharp`, `fs-extra` – file uploads and image processing
- `nodemailer` – email sending
- `@google/generative-ai` – Gemini integration (AI assistant)

### 2. Environment variables (.env)

Create a `.env` file in the `server/` directory. The exact list is defined in the source (`src/services/authService.js`, `src/security/tokenManager.js`, etc.), but you typically need:

- **Database:**
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
- **JWT / tokens:**
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `TOKEN_EXPIRES_IN`, `REFRESH_EXPIRES_IN` (if used)
- **Email:**
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
- **AI / Gemini (optional but recommended):**
  - `GEMINI_API_KEY`
- **Frontend CORS:**
  - `CLIENT_ORIGINS` – comma‑separated list of allowed origins
- **Other:**
  - Base upload paths, domain, etc. (as referenced in the code).

Example minimal `.env` (for illustration):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kaszint

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@example.com
SMTP_PASS=supersecret
SMTP_FROM="Kaszint <no-reply@example.com>"

GEMINI_API_KEY=your_gemini_key

CLIENT_ORIGINS=http://localhost:3000
```

### 3. Database initialization

Use the scripts under `scripts/` to create / seed the database:

- **Base DB setup:**

  ```bash
  npm run setup:db
  ```

  Typically:
  - creates tables
  - runs base schema / seed data (depending on the script content)

- **Run migrations:**

  ```bash
  npm run migrate
  ```

  This executes `src/database/migrations/001_add_refresh_tokens.js`, which creates the refresh token tables/columns.

### 4. Start the backend

- **Development mode (nodemon):**

  ```bash
  npm run dev
  ```

- **Production / normal start:**

  ```bash
  npm start
  ```

The default port is defined in `index.js` / `server.js` (often `process.env.PORT` or `3001/4000`). Use this from your browser and the React client (typically `http://localhost:<port>/api/...`).

### 5. Important endpoints (high level)

- `GET /health` – basic health check (`src/app.js` / `src/routes/health.js`).
- `POST /api/auth/login`, `POST /api/auth/register`, etc. – auth endpoints.
- `GET/POST /api/bookings` – booking management.
- `GET /api/salons` – salon data.
- `GET/POST /api/assets` – asset / media management.
- `GET /api/dashboard/...` – dashboard stats, charts, configuration.

Check `src/routes/` and `src/controllers/` for the full structure.

---

## Frontend (`client/`) – Setup and run

### 1. Install dependencies

```bash
cd "express react/client"
npm install
```

Key dependencies from `package.json`:

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `framer-motion`
- `recharts`, `reaviz`
- `date-fns`
- `lucide-react`

### 2. Start the dev server

```bash
npm start
```

By default:

- CRA dev server runs at `http://localhost:3000`.
- The client calls the backend via `axios` (typically `http://localhost:<backend-port>/api/...`).

### 3. Using the UI/UX components

`client/QUICK_START.md` contains detailed examples; briefly:

- **Global provider** in `App.js`:

  ```jsx
  import { ToastProvider } from './components/UI';

  function App() {
    return (
      <ToastProvider>
        {/* Routes */}
      </ToastProvider>
    );
  }
  ```

- **Auth examples (Login component)**:
  - Import `useToast`, `Button`, `Input` from `components/UI`.
  - Show toast messages on successful/failed login.

- **Dashboard examples**:
  - `Modal`, `useModal` – confirmation dialogs (e.g. delete).
  - `Skeleton` components – loading skeletons.
  - `PageTransition` – animated page transitions.

- **CSS customization**:
  - Main CSS variables in `styles/globals.css`:

    ```css
    :root {
      --brand: #5b8cff;
      --success: #22c55e;
      --danger: #ef4444;
      --text: #e8e8f0;
    }
    ```

### 4. Production build

```bash
npm run build
```

This creates a minified production build in the `build/` folder, which you can serve with a static file server or behind a reverse proxy (e.g. Nginx, Node backend, or any hosting provider).

---

## Backend–frontend integration

- Backend CORS config is in `src/app.js`:
  - allows `localhost` requests and origins defined in `.env` under `CLIENT_ORIGINS`.
- On the frontend, the API base URL is usually configured centrally in an axios instance:
  - e.g. `axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api' })`
- **Recommendation**: define `REACT_APP_API_URL` in `client/.env`:

  ```env
  REACT_APP_API_URL=http://localhost:4000/api
  ```

  This makes it easy to switch between dev/stage/prod.

---

## Typical dev workflow

1. **Start backend**:
   - `cd "express react/server"`
   - ensure `.env` is configured, DB is ready
   - `npm run dev`
2. **Start frontend**:
   - `cd "express react/client"`
   - `npm start`
3. **In the browser**:
   - go to `http://localhost:3000` – React SPA
   - verify network requests (CORS, base URL, auth headers, etc.)
4. **Test auth and dashboard**:
   - use `create-test-user.js` (if applicable) via `node create-test-user.js`
   - log into the dashboard and test main user flows (login, bookings, stats, settings).

---

## Troubleshooting

- **CORS issues**:
  - Check that the frontend origin is included in `CLIENT_ORIGINS`.
  - Inspect the `cors` config in `src/app.js`.
- **Database issues**:
  - Verify DB‑related `.env` values.
  - Try connecting with a standalone MySQL client.
- **Emails not sending**:
  - Verify SMTP settings (host, port, TLS/SSL, user/pass).
  - Check logs from `emailService`.
- **AI / Gemini issues**:
  - Verify `GEMINI_API_KEY` and any quota/limits.
- **Frontend build / npm problems**:
  - Delete `node_modules` and `package-lock.json`, then run `npm install` again.

---

## Summary

The `express react` folder provides a complete **web salon platform**:

- **Backend**: secure auth, booking management, AI integration and media handling.
- **Frontend**: modern, responsive UI with a strong UX‑focused component library.

The root `README.md` explains how this part combines with the Python Telegram chatbot into a single ecosystem.

