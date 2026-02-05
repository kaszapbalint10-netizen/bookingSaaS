## Kaszint – Szalon asszisztens ökoszisztéma

Ez a repó két fő projektet tartalmaz:

- **`chatbot(py)`**: Python alapú, több szalont kiszolgáló Telegram chatbot, AI‑alapú időpontfoglalási logikával és Google Calendar integrációval.
- **`express react`**: Teljes értékű webes felület (React frontend + Express/Node backend) szalon‑regisztrációval, vendégoldallal és dashboarddal.

Az alábbiakban rövid áttekintést kapsz, a részletes dokumentációt pedig a projektek saját README fájljaiban találod.

---

## Mappastruktúra áttekintés

- **`chatbot(py)/`**
  - **`backend/`**: adatbázis, naptár és közös logika
  - **`chatbot/`**: Telegram bot belépési pont, AI modulok, üzenetkezelők
- **`express react/`**
  - **`server/`**: Express REST API, auth, foglalások, fájlfeltöltés, e‑mail, AI
  - **`client/`**: React single‑page app (auth, dashboard, UI komponensek)

---

## Gyors indítás – fejlesztői környezet

### Előfeltételek

- **Node.js** LTS (ajánlott ≥ 18)
- **npm** vagy **yarn**
- **Python 3.10+**
- Elérhető **MySQL/MariaDB** szerver

### 1. Backend + frontend (webes felület)

Lásd részletesen: `express react/README.hu.md`, röviden:

1. **Backend** (`express react/server`):
   - `cd "express react/server"`
   - `npm install`
   - `.env` beállítása (adatbázis, e‑mail, JWT, stb.)
   - Adatbázis inicializálás: `npm run setup:db` (és/vagy migrációk)
   - Indítás fejlesztői módban: `npm run dev`
2. **Frontend** (`express react/client`):
   - `cd "express react/client"`
   - `npm install`
   - `npm start` → `http://localhost:3000`

### 2. Telegram chatbot(ok)

Lásd részletesen: `chatbot(py)/README.hu.md`, röviden:

1. **Függőségek telepítése**:
   - `cd "chatbot(py)"`
   - `pip install -r requirements.txt`
2. **Konfiguráció**:
   - Telegram bot tokenek, Google Calendar azonosítók, adatbázis elérés beállítása
   - Google service account JSON elérési útvonal frissítése, ha kell
3. **Bot indítása**:
   - `python -m chatbot.main` vagy `python chatbot/main.py`

---

## Hol találsz részletesebb leírást?

- **Python Telegram chatbot**: `chatbot(py)/README.hu.md`
- **Express/Node backend + React kliens**: `express react/README.hu.md`

Ezekben részletes példákat találsz az `.env` változókra, futtatási parancsokra és a fő funkciókra.

