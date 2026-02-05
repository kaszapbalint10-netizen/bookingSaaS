## Express + React – Szalon webes platform

Ez a mappa tartalmazza a **webes felületet**:

- **Backend**: `server/` – Express/Node.js REST API
- **Frontend**: `client/` – React alapú SPA (Create React App)

A cél egy komplett **szalon menedzsment rendszer**:

- Szalon regisztráció és hitelesítés
- Vendégoldal, időpontfoglalási folyamat
- Dashboard statisztikákkal, naptárral, beállításokkal
- AI‑alapú asszisztens (Google Gemini) és média kezelés

---

## Mappastruktúra

- **`server/`**
  - `index.js`, `server.js`: a Node/Express alkalmazás indítása.
  - `src/app.js`: az Express app konfigurációja (CORS, route‑ok, statikus fájlok, hibakezelés).
  - `src/routes/`: REST végpontok (auth, bookings, dashboard, guest, salons, assets, health).
  - `src/controllers/`: üzleti logika (auth, asset kezelés).
  - `src/services/`: szolgáltatásréteg (auth, email, AI, képfeldolgozás, storage).
  - `src/security/`: titkosítás, token kezelés (JWT, password hash).
  - `src/utils/`: kisegítő modulok (NLU, üzenetgenerálás, árképzés, workflow).
  - `config/`: asszisztens konfigurációk (promptok, adatok, képek).
  - `uploads/`: feltöltött fájlok (logók, profilképek, faviconok, stb.).
- **`client/`**
  - `src/App.js`, `src/index.js`: React belépési pontok.
  - `src/components/`:
    - `Auth/`: bejelentkezés, regisztráció, jelszóvisszaállítás, email verifikáció.
    - `Dashboard/`: dashboard nézetek, szekciók, statisztikák, reusable UI elemek.
    - `SalonBrowser/`: szalon böngészés / vendég oldalak.
    - `UI/`: újragondolt, modern UI komponensek (Button, Input, Modal, Toast, Skeleton, stb.).
    - `CarAssistant/`, `AssistantSelector/`, `GuestRegistration/`: speciális funkciók és folyamatok.
  - `public/`: statikus assetek (háttérképek, ikonok).
  - `styles/`: globális és accessibility CSS (pl. CSS változók, reszponzív stílusok).

---

## Előfeltételek

- **Node.js** LTS (ajánlott: ≥ 18)
- **npm** (vagy Yarn)
- **MySQL/MariaDB** adatbázis
- Külső szolgáltatások:
  - SMTP szerver (email küldéshez – pl. regisztrációs/ellenőrző emailek)
  - Google Gemini API kulcs (opcionális, AI funkciókhoz)

---

## Backend (`server/`) – Telepítés és futtatás

### 1. Függőségek telepítése

```bash
cd "express react/server"
npm install
```

A `package.json` alapján a backend többek között ezeket használja:

- `express`, `cors`
- `mysql2` – adatbázis kapcsolat
- `jsonwebtoken`, `argon2` / `bcrypt` – auth és jelszókezelés
- `multer`, `sharp`, `fs-extra` – fájlfeltöltés és képfeldolgozás
- `nodemailer` – email küldés
- `@google/generative-ai` – Gemini integráció (AI asszisztens)

### 2. Környezeti változók (.env)

Hozz létre egy `.env` fájlt a `server/` mappában. A pontos lista a forráskódban található (`src/services/authService.js`, `src/security/tokenManager.js`, stb.), de tipikusan az alábbiakra lesz szükség:

- **Adatbázis:**
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
- **JWT / tokenek:**
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `TOKEN_EXPIRES_IN`, `REFRESH_EXPIRES_IN` (ha használva van)
- **Email:**
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
- **AI / Gemini (opcionális, de ajánlott):**
  - `GEMINI_API_KEY`
- **Frontend CORS:**
  - `CLIENT_ORIGINS` – vesszővel elválasztott lista az engedélyezett origin‑ekről
- **Egyéb:**
  - Fájlfeltöltés alap útvonalai, domain, stb. (ahogy a kódban hivatkozva van).

Példa minimális `.env` (csak illusztráció):

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

### 3. Adatbázis inicializálás

Az adatbázist a `scripts/` mappában lévő script‑ekkel hozhatod létre / töltheted fel:

- **Alap DB setup:**

  ```bash
  npm run setup:db
  ```

  Ez tipikusan:
  - Létrehozza a táblákat.
  - Futtatja az alap sémát / seed adatokat (ha a scriptben így van definiálva).

- **Migrációk futtatása:**

  ```bash
  npm run migrate
  ```

  Ez meghívja a `src/database/migrations/001_add_refresh_tokens.js` fájlt, amely a refresh token táblákat / mezőket hozza létre.

### 4. Backend indítása

- **Fejlesztői mód (nodemon):**

  ```bash
  npm run dev
  ```

- **Production / sima start:**

  ```bash
  npm start
  ```

Alapértelmezett portot az `index.js` / `server.js` definiálja (gyakran `process.env.PORT` vagy `3001/4000`), a böngészőből és a React kliensből is ezt kell hívni (tipikusan `http://localhost:<port>/api/...`).

### 5. Fontos endpointok (áttekintő jelleggel)

- `GET /health` – egyszerű health check (`src/app.js` / `src/routes/health.js`).
- `POST /api/auth/login`, `POST /api/auth/register`, stb. – auth végpontok.
- `GET/POST /api/bookings` – foglalások kezelése.
- `GET /api/salons` – szalon adatok.
- `GET/POST /api/assets` – asset / média kezelés.
- `GET /api/dashboard/...` – dashboard‑hoz tartozó statisztikák, grafikonok, konfigurációk.

A pontos struktúrát a `src/routes/` és `src/controllers/` fájlokból tudod részletesen kiolvasni.

---

## Frontend (`client/`) – Telepítés és futtatás

### 1. Függőségek telepítése

```bash
cd "express react/client"
npm install
```

A `package.json` alapján a fő függőségek:

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `framer-motion`
- `recharts`, `reaviz`
- `date-fns`
- `lucide-react`

### 2. Fejlesztői szerver indítása

```bash
npm start
```

Alapértelmezetten:

- A CRA dev szerver a `http://localhost:3000` címen fut.
- A backendhez `axios`‑szal csatlakozik (jellemzően `http://localhost:<backend-port>/api/...`).

### 3. UI/UX komponensek használata

A `client/QUICK_START.md` részletes példákat ad az új UI komponensekre. Rövid összefoglaló:

- **Globális provider** az `App.js`‑ben:

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

- **Auth példák (Login komponens)**:
  - `useToast`, `Button`, `Input` komponensek importálása a `components/UI`‑ból.
  - Sikeres / sikertelen bejelentkezéskor toast üzenetek megjelenítése.

- **Dashboard példák**:
  - `Modal`, `useModal` – megerősítés dialógusokhoz (pl. törlés).
  - `Skeleton` komponensek – betöltés közbeni váz UI.
  - `PageTransition` – animált oldaltöltés / navigáció.

- **CSS testreszabás**:
  - A legfontosabb CSS változók a `styles/globals.css`‑ben:

    ```css
    :root {
      --brand: #5b8cff;
      --success: #22c55e;
      --danger: #ef4444;
      --text: #e8e8f0;
    }
    ```

### 4. Build készítése

Production build:

```bash
npm run build
```

Ez a `build/` mappába készíti el a minifikált statikus fájlokat, amelyeket egy külön static szerverrel vagy reverse proxy mögött lehet kiszolgálni (pl. Nginx, a Node backend vagy más hosting).

---

## Backend–frontend integráció

- A backend CORS beállításai a `src/app.js`‑ben találhatók:
  - Engedélyezi a `localhost`‑ról érkező kéréseket és a `.env`‑beli `CLIENT_ORIGINS`‑ben definiált origin‑eket.
- A frontend oldalon az API URL jellemzően egy központi configban / axios instance‑ben van beállítva:
  - Pl. `axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api' })`
- **Javaslat**: definiálj egy `REACT_APP_API_URL` változót a `client/.env` fájlban:

  ```env
  REACT_APP_API_URL=http://localhost:4000/api
  ```

  Így a környezetek (dev/stage/prod) között könnyen válthatsz.

---

## Tipikus fejlesztői workflow

1. **Backend indul**:
   - `cd "express react/server"`
   - `.env` beállítva, DB kész
   - `npm run dev`
2. **Frontend indul**:
   - `cd "express react/client"`
   - `npm start`
3. **Böngészőben**:
   - `http://localhost:3000` – React SPA
   - Ellenőrizd a network requesteket (CORS, base URL, auth header, stb.).
4. **Auth és dashboard tesztelése**:
   - Használd a `create-test-user.js` scriptet (ha erre van script): pl. `node create-test-user.js`.
   - Lépj be a dashboardra és teszteld az alap user flow‑kat (login, foglalás, statisztikák, beállítások).

---

## Hibaelhárítás

- **CORS hiba**:
  - Ellenőrizd, hogy a frontend origin szerepel‑e a `CLIENT_ORIGINS` listában.
  - Nézd meg a backend `src/app.js` `cors` konfigurációját.
- **Adatbázis hiba**:
  - Ellenőrizd a DB‑re vonatkozó `.env` beállításokat.
  - Próbálj meg külön `mysql` klienssel csatlakozni.
- **Email nem megy ki**:
  - Ellenőrizd az SMTP adataidat (host, port, TLS/SSL, user/pass).
  - Nézd meg a logokat (`emailService`).
- **AI / Gemini hiba**:
  - Ellenőrizd a `GEMINI_API_KEY`‑t és az esetleges kvóta/limit állapotát.
- **Frontend build / npm hibák**:
  - Töröld a `node_modules` és a `package-lock.json`‑t, majd futtasd újra az `npm install`‑t.

---

## Összegzés

Az `express react` mappa egy teljes **webes szalonplatformot** tartalmaz:

- **Backend**: biztonságos auth, foglaláskezelés, AI integráció és média kezelés.
- **Frontend**: modern, reszponzív UI, erős UX fókuszú komponensekkel.

A gyökérben lévő `README.hu.md` összefoglalja, hogyan illeszkedik ez a rész a Python Telegram chatbot projekttel együtt egy egységes rendszerbe.


